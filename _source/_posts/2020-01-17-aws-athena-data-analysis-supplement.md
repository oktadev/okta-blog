---
disqus_thread_id: 7822770412
discourse_topic_id: 17201
discourse_comment_url: https://devforum.okta.com/t/17201
layout: blog_post
title: "AWS Athena as a Data Analysis Supplement"
author: omar-darwish
by: internal-contributor
communities: [security]
description: "Learn to use AWS Athena as a data analysis supplement."
tags: [aws, aws-athena, data-analysis, security]
tweets:
- "Need to be able to analyze security logs archived in S3? We've got you covered!"
- "Do data analysis beyond the 'hot' caching window. Analyze security logs archived in S3!"
image: blog/aws-athena-data-analysis-supplement/aws-athena-featured-image.png
type: awareness
---

As part of a security investigation, you may be tasked with determining whether a specific API action occurred throughout your cloud deployment within some distant date range. This would normally be straightforward to determine, by using either the provided CloudTrail querying console or a Security Information and Event Management platform (SIEM) which is set to consume these logs such as Splunk or Elasticsearch. For most data analysis solutions, the amount of data ingested or stored becomes cost-prohibitive beyond a certain threshold. A [common](https://docs.splunk.com/Documentation/Splunk/8.0.0/Indexer/Bucketsandclusters) [solution](https://www.elastic.co/blog/hot-warm-architecture-in-elasticsearch-5-x) to this problem is to have a rolling window of "hot" or "warm" caching for recently produced data. This data is queryable on demand and is fastest to be analyzed. However, data that is older than this threshold is evicted from the SIEM and archived in a storage solution such as S3 (perhaps with object lifecycle management). This data, therefore, becomes no longer queryable within the SIEM.

For such an investigation, we need to be able to analyze CloudTrail logs archived in S3. Moving even a small part of this gargantuan data set from S3 back into your SIEM would typically be quite an undertaking. This is unfortunately a nonstarter. Thankfully, Amazon provides us with [Athena](https://aws.amazon.com/athena/), which is a data analysis solution which lets you explore data stored in S3 in place using SQL with minimal setup. It's an immensely powerful tool.

In this post, we take a quick look at:

* How to get started with querying CloudTrail logs using Athena.
* Using partitions to limit data scanned, increasing efficiency while reducing cost.
* Querying partitions strategically.
* A little bit of Python to put it all together.

## Introduce S3 Data to Athena

Before Athena can query data in S3, it needs to be made aware that data exists and how it's structured. We do this by defining a table. Luckily, Amazon provides a great starting point for analyzing [their service logs](https://docs.aws.amazon.com/athena/latest/ug/querying-AWS-service-logs.html) in their documentation. Let's take a look at the [example for CloudTrail](https://docs.aws.amazon.com/athena/latest/ug/cloudtrail-logs.html):

```sql
CREATE EXTERNAL TABLE default.cloudtrail_logs (
eventversion STRING,
useridentity STRUCT<
               type:STRING,
               principalid:STRING,
               arn:STRING,
               accountid:STRING,
               invokedby:STRING,
               accesskeyid:STRING,
               userName:STRING,
sessioncontext:STRUCT<
attributes:STRUCT<
               mfaauthenticated:STRING,
               creationdate:STRING>,
sessionissuer:STRUCT<  
               type:STRING,
               principalId:STRING,
               arn:STRING, 
               accountId:STRING,
               userName:STRING>>>,
eventtime STRING,
eventsource STRING,
eventname STRING,
awsregion STRING,
sourceipaddress STRING,
useragent STRING,
errorcode STRING,
errormessage STRING,
requestparameters STRING,
responseelements STRING,
additionaleventdata STRING,
requestid STRING,
eventid STRING,
resources ARRAY<STRUCT<
               ARN:STRING,
               accountId:STRING,
               type:STRING>>,
eventtype STRING,
apiversion STRING,
readonly STRING,
recipientaccountid STRING,
serviceeventdetails STRING,
sharedeventid STRING,
vpcendpointid STRING
)
ROW FORMAT SERDE 'com.amazon.emr.hive.serde.CloudTrailSerde'
STORED AS INPUTFORMAT 'com.amazon.emr.cloudtrail.CloudTrailInputFormat'
OUTPUTFORMAT 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
LOCATION 's3://CloudTrail_bucket_name/AWSLogs/Account_ID/';
```

Open up the Athena console and run the statement above. Be sure to specify the correct S3 Location and that all the necessary IAM permissions have been granted. This statement tells Athena:

* To create a new table named `cloudtrail_logs` and that this table has a set of columns corresponding to the fields found in a [CloudTrail log](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-log-file-examples.html).
* To use the [SerDe](https://docs.aws.amazon.com/athena/latest/ug/serde-reference.html) (Serializer/Deserializer) [specific to CloudTrail](https://docs.aws.amazon.com/athena/latest/ug/cloudtrail.html) logs.
* What [input and output formats](https://docs.aws.amazon.com/athena/latest/ug/supported-format.html) this table uses.
* Where the data is located in S3.

After this table is defined, we are then able to issue SQL queries against `cloudtrail_logs`:

```sql
SELECT sourceipaddress, eventname, awsregion
FROM default.cloudtrail_logs
LIMIT 10;
```

## Add Partitioning for S3 Directories

So far, we have a way of querying our data, but it's not very efficient. Whenever we query this table, Athena recursively scans the specified S3 path, looking at all files rooted at the directory we specified as the `LOCATION` for the table. This directory is traversed in parallel before results are aggregated and returned. In some cases, this might be what is needed, but it's safe to say that in a majority of cases we're only interested in a subset of this directory. Can we do better?

This is where [partitioning](https://docs.aws.amazon.com/athena/latest/ug/partitions.html) comes into play. When we define partitions, we direct what data Athena scans. Athena is billed by the amount of data it scans, so scanning at the minimum number of partitions is paramount to reducing time and cost.

In our example, we know that CloudTrail logs are [partitioned](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-find-log-files.html) by region, year, month, and day. Adding partitions in Athena is two-fold: first, we must declare that our table is partitioned by certain columns, and then we must define what partitions actually exist. For example, if you tell Athena that a table is partitioned by columns named `region`, `year`, `month`, and `day`, it does not automatically know that a partition created on January 1, 2019 for `us-east-1` exists. We must explicitly add a partition with `(region='us-east-1', year=2019, month=1, day=1)` and specify where this partition's data is located.

Our original `cloudtrail_logs` table was not partitioned, so let's delete and recreate it with partitions.

> Note: Deleting an Athena table does not affect the actual data stored in S3.

```sql
DROP TABLE default.cloudtrail_logs;
```

To create a suitable table with partitions, we use the sample CloudTrail table definition from above, but we modify it slightly to create our new `cloudtrail_logs_partitioned` table:

```sql
CREATE EXTERNAL TABLE default.cloudtrail_logs_partitioned (
  <column list>
)
PARTITONED BY (
  `region` string,
  `year` int,
  `month` int,
  `day` int
)
ROW FORMAT SERDE 'com.amazon.emr.hive.serde.CloudTrailSerde'
STORED AS INPUTFORMAT 'com.amazon.emr.cloudtrail.CloudTrailInputFormat'
OUTPUTFORMAT 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
LOCATION 's3://CloudTrail_bucket_name/AWSLogs/Account_ID/';
```

After executing this statement, Athena understands that our new `cloudtrail_logs_partitioned` table is partitioned by 4 columns `region`, `year`, `month`, and `day`. Unlike our unpartitioned `cloudtrail_logs` table, If we now try to query `cloudtrail_logs_partitioned`, we won't get any results. At this stage, Athena knows this table can contain partitions, but we haven't defined any yet, so there are no partitions for it to query and no results are returned. Let's remedy this by defining some partitions:

> Note: At the time of writing, Athena allows only one statement per query, so each of the following statements must be executed in separate queries.

```sql
ALTER TABLE default.cloudtrail_logs_partitioned ADD IF NOT EXISTS
PARTITION (
    region = 'us-east-1',
    year = 2019,
    month = 1,
    day = 1
  )
)
LOCATION 's3://CloudTrail_bucket_name/AWSLogs/Account_ID/vpcflowlogs/us-east-1/2019/01/01/';

ALTER TABLE default.cloudtrail_logs_partitioned ADD IF NOT EXISTS
PARTITION (
    region = 'us-east-1',
    year = 2019,
    month = 1,
    day = 14
  )
)
LOCATION 's3://CloudTrail_bucket_name/AWSLogs/Account_ID/vpcflowlogs/us-east-1/2019/01/14/';

ALTER TABLE default.cloudtrail_logs_partitioned ADD IF NOT EXISTS
PARTITION (
    region = 'us-west-1',
    year = 2018,
    month = 12,
    day = 25
  )
)
LOCATION 's3://CloudTrail_bucket_name/AWSLogs/Account_ID/vpcflowlogs/us-west-1/2018/12/25/';
```

We now have a partitioned table, with 3 active partitions. Amazing! We'll leave it as an exercise for the reader to automate partition management... for now.

## Query with Partitions

If we query `cloudtrail_logs_partitioned` without specifying any partition keys, like in the example below:

```sql
SELECT sourceipaddress, eventname, awsregion
FROM default.cloudtrail_logs_partitioned;
```

Athena will traverse all partitions it knows about for a partitioned table. In our case, all files under these paths will be scanned:

* `s3://CloudTrail_bucket_name/AWSLogs/Account_ID/vpcflowlogs/us-east-1/2019/01/01/`
* `s3://CloudTrail_bucket_name/AWSLogs/Account_ID/vpcflowlogs/us-east-1/2019/01/14/`
* `s3://CloudTrail_bucket_name/AWSLogs/Account_ID/vpcflowlogs/us-west-1/2018/12/25/`

We can also pick and choose partitions:

```sql
-- scans s3://CloudTrail_bucket_name/AWSLogs/Account_ID/vpcflowlogs/us-west-1/2018/12/25/
SELECT sourceipaddress, evenname, awsregion
FROM default.cloudtrail_logs_partitioned
WHERE region = 'us-west-1'
  AND year = 2018,
  AND month = 12,
  AND day = 25;

-- scans
-- `s3://CloudTrail_bucket_name/AWSLogs/Account_ID/vpcflowlogs/us-east-1/2019/01/01/`
-- `s3://CloudTrail_bucket_name/AWSLogs/Account_ID/vpcflowlogs/us-east-1/2019/01/14/`
SELECT sourceipaddress, evenname, awsregion
FROM default.cloudtrail_logs_partitioned
WHERE region = 'us-west-1'
  AND year = 2019,
  AND month = 1;
```

Partitions grant us significantly more control over what data Athena will scan (and bill us for). A huge improvement!

## S3 and Athena: Put it All Together

Let's illustrate with an example. Assume that we have automated partition management, and our `cloudtrail_logs_partitioned` table now has partitions for every `(region, year, month, day)` tuple for the year of 2019. 

We want to investigate user Bob's activity

* Bob's username is `bob`
* We're interested only in investigating actions in the `us-east-2` region for our AWS account with ID `111111111111`
* The activity window we need to look into is the date range between 3/01/2019 to 5/31/2019
* We interested two roles that `bob` may have assumed:
  * `devops`
  * `it`

## Discovering Access Keys

We need to look at all [AssumeRole](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html) events produced by Bob and determine what access keys were granted for each session. To do this, we'll first query for the events we're interested in, use those to derive access keys, and store this as a new table `bob_access_keys`.

```sql
-- declare a temporary role_assumptions table
WITH role_assumptions (eventtime, year, month, day, rolearn, accesskeyid, region) AS (
  SELECT eventtime,
    -- break down eventtime into year, month, and day
    cast(regexp_extract(eventtime, '(^\d{4})-(\d{2})-(\d{2})', 1) as integer) AS year, 
    cast(regexp_extract(eventtime, '(^\d{4})-(\d{2})-(\d{2})', 2) as integer) AS month, 
    cast(regexp_extract(eventtime, '(^\d{4})-(\d{2})-(\d{2})', 3) as integer) AS day
    json_extract_scalar(requestparameters, '$.roleArn') AS rolearn,
    json_extract_scalar(responseelements, '$.credentials.accessKeyId') AS accesskeyid,
    awsregion AS region
  FROM default.cloudtrail_logs
  WHERE useridentity.arn='arn:aws:iam::111111111111:user/bob'
    AND eventname = 'AssumeRole'
    AND awsregion='us-east-2'
    AND year = 2019
    AND month BETWEEN 3 AND 5
),

-- Extract the access keys for only the role assumptions we are interested in and store
-- them in a new table
CREATE TABLE default.bob_access_keys AS
SELECT eventtime, year, month, day, rolearn, accesskeyid, region
FROM role_assumptions
WHERE rolearn IN (
  'arn:aws:iam::111111111111:role/devops',
  'arn:aws:iam::111111111111:role/it'
);
```

> Note: we use a table instead of a [view](https://docs.aws.amazon.com/athena/latest/ug/views.html) to reduce the amount of data scanned for subsequent queries that use this smaller dataset.

## Introducing For-each Queries

We now have a new table `bob_access_keys` containing all the access keys that Bob acquired with his account by assuming the `devops` or `it` roles, the region these keys were used in, the time, year, month, and day that these keys were used. With this information, we need to figure out what API actions each of these access keys was used for.

Essentially, each row of this table will be an access key with a specific partition tuple of `(region, year, month, day)`. This tuple specifies which partition in our `cloudtrail_logs_partitioned` table should be queried for the given access key. *For each* of these tuples we would now like to query `cloudtrail_logs_partitioned` table, but *only* scan partitions we are interested in.

We can accomplish this at the application layer by writing a simple Python script. This script first retrieves all rows from the `bob_access_keys` table, and for each record, issues a query against `cloudtrail_logs_partitioned` using the partition keys from the `bob_access_keys` row. We then tell Athena to store the results of the query for this row at a common parent directory in S3. After all queries complete, we can define a new table in Athena and set its `LOCATION` at this parent directory. This final table will allow us to view the aggregate results from all individual queries.

## Python Implementation

We implement this approach with Python 3 by first querying partitions individually, and then defining a table in Athena to view our results.

### Partitioned Queries

Using the [AWS Python SDK](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html), let's first define a helper function which will start a query, keep polling for completion status, and then return results as a [paginator](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/paginators.html):

> Note: For simplicity, we use the bucket that Athena [creates by default](https://docs.aws.amazon.com/athena/latest/ug/querying.html#query-results-specify-location) as our default result location. The default location can be any bucket that you have [granted Athena access](https://docs.aws.amazon.com/athena/latest/ug/setting-up.html) to.

```python
import boto3
import time
import textwrap

COMPLETION_POLL_TIME = .3 # 300 milliseconds
ATHENA_ACCOUNT = '111111111111'
ATHENA_REGION = 'us-east-2'

# We must specify output location for every query, so let's use
# the default S3 bucket that Athena stores results to.

ATHENA_DEFAULT_LOCATION = f's3://aws-athena-query-results-{ATHENA_ACCOUNT}-{ATHENA_REGION}/'

athena = boto3.client('athena')

def query(query, location=ATHENA_DEFAULT_LOCATION):
    resp = athena.start_query_execution(
        QueryString=query,
        ResultConfiguration={
            'OutputLocation': location
        }
    )
    query_id = resp['QueryExecutionId'] # Save id

    # Keep polling until query is done
    completed = False
    while not completed:
        resp = athena.get_query_execution(QueryExecutionId=query_id)
        status = resp['QueryExecution']['Status']['State']

        if status not in (
            'SUCCEEDED',
            'FAILED',
            'CANCELLED'
        ):
            print(f'Query {query_id} still running')
            time.sleep(COMPLETION_POLL_TIME)
        else:
            if status != 'SUCCEEDED':
                raise Exception(resp)

            completed = True

    results = athena.get_paginator('get_query_results')
    return results.paginate(QueryExecutionId=query_id)
```

We then start defining our main script. First, query for all access key rows:

```py
q = 'SELECT accesskeyid, region, year, month, day FROM default.bob_access_keys;'
beyond_header = False # Explained below

# Query for access keys
for result_page in query(q):
  # ... and do something with results
```

For each row, we take the access key and the year, month, and day it was used and query against our `cloudtrail_logs_partitioned` table:

```py
for row in result_page['ResultSet']['Rows']:
    # The first row is the column header
    if not beyond_header:
        beyond_header = True
        continue

    # Grab column values for each row
    access_key, region, year, month, day = [data['VarCharValue'] for data in row['Data']]

    # Query against partitioned table table
    q = textwrap.dedent(f"""
    SELECT eventtime, eventtype, eventname, eventsource
    FROM default.cloudtrail_logs_partitioned
    WHERE useridentity.accesskeyid = '{access_key}'
        AND region = '{region}'
        AND year = {year}
        AND month = {month}
        AND day = {day}
    """).strip()

    # Store all results to the same location
    # We use the default Athena location for simplicity
    location = ATHENA_DEFAULT_LOCATION + 'bob-role-activity'
    query(q, location=location)
```

Putting it all together, we get the complete script:

```py
import boto3
import time
import textwrap

COMPLETION_POLL_TIME = .3 # 300 miliseconds
ATHENA_ACCOUNT = '111111111111'
ATHENA_REGION = 'us-east-2'

ATHENA_DEFAULT_LOCATION = f's3://aws-athena-query-results-{ATHENA_ACCOUNT}-{ATHENA_REGION}/'

athena = boto3.client('athena')

def query(query, location=ATHENA_DEFAULT_LOCATION):
    resp = athena.start_query_execution(
        QueryString=query,
        ResultConfiguration={
            'OutputLocation': location
        }
    )
    query_id = resp['QueryExecutionId'] # Save id

    # Keep polling until query is done
    completed = False
    while not completed:
        resp = athena.get_query_execution(QueryExecutionId=query_id)
        status = resp['QueryExecution']['Status']['State']

        if status not in (
            'SUCCEEDED',
            'FAILED',
            'CANCELLED'
        ):
            print(f'Query {query_id} still running')
            time.sleep(COMPLETION_POLL_TIME)
        else:
            if status != 'SUCCEEDED':
                raise Exception(resp)

            completed = True

    results = athena.get_paginator('get_query_results')
    return results.paginate(QueryExecutionId=query_id)

if __name__ == '__main__':
    q = 'SELECT accesskeyid, region, year, month, day FROM default.bob_access_keys;'
    beyond_header = False

    # Query all access keys
    for result_page in query(q):
        # Loop through all access keys
        # Could be parallelized
        for row in result_page['ResultSet']['Rows']:
            # The first row is the column header
            if not beyond_header:
                beyond_header = True
                continue

            # Grab column values for each row
            access_key, region, year, month, day = [data['VarCharValue'] for data in row['Data']]

            # Query against partitioned table table
            q = textwrap.dedent(f"""
            SELECT eventtime, eventtype, eventname, eventsource
            FROM default.cloudtrail_logs_partitioned
            WHERE useridentity.accesskeyid = '{access_key}'
                AND region = '{region}'
                AND year = {year}
                AND month = {month}
                AND day = {day}
            """).strip()

            # Store all results to the same location
            location = ATHENA_DEFAULT_LOCATION + 'bob-role-activity'
            query(q, location=location)
```

### Result Table

After running the script above, we now have an S3 directory containing CSV results from each of the individual queries we ran. To access this data, we need to define a new table in Athena and point it at this directory. We can do this from the Athena console:

```sql
CREATE EXTERNAL TABLE default.bob_role_activity (
  `eventtime` string,
  `eventtype` string,
  `eventname` string,
  `eventsource` string)
ROW FORMAT SERDE
  'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
  'escapeChar'='\\',
  'separatorChar'=',')
STORED AS INPUTFORMAT
  'org.apache.hadoop.mapred.TextInputFormat'
OUTPUTFORMAT
  'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
LOCATION
  's3://aws-athena-query-results-111111111111-us-east-2/bob-role-activity';
```

This table is like any other, so we can query it to view our results:

```sql
SELECT * FROM default.bob_role_activity;
```

This query as it stands might produce errors or gibberish results. This is because when Athena stores results, it also stores an accompanying [metadata file](https://docs.aws.amazon.com/athena/latest/ug/querying.html#w3aac25b7c11). At the time of writing, there is no option to disable outputting metadata, so our S3 directory contains a mix of CSV result files and metadata files.

Therefore, to query our table, we have two options. We can either move or delete the `.metadata` files from the directory, or we can use a trick to tell Athena to ignore these files when querying:

```sql
SELECT *
WHERE "$PATH" NOT LIKE '%.metadata'
FROM default.bob_role_activity
```

`$PATH` is a [hidden PrestoDB column](https://github.com/prestodb/presto/issues/8098) which specifies the file path of a file that is searched. We can use this column to ignore any files ending in `.metadata`. Exactly what we want!

## Learn More About  S3, Athena, and Application Security

We've only scratched the surface of utility that Athena provides investigations and security analysis. Why not build on what you've learned?

* The implementation above is sequential and could be made more efficient with parallelization. This introduces additional complexity. You will have to choose an appropriate concurrency/parallelization scheme for your language of choice while making sure not to hit Athena's concurrent query limit, but the performance boost is well worth it!
* What if some access key rows come from the same partition? Consider adding logic that combines these queries.
* Instead of issuing the final table definition by hand, consider automating this with code that understands the resulting column types. Perhaps this additional code could also run your final query on the result table, and delete the table upon completion.

If you like this post, check out some other related content on our blog.

* [Use AWS CloudFormation to Automate Static Site Deployment with S3](/blog/2018/07/31/use-aws-cloudformation-to-automate-static-site-deployment-with-s3)
* [Easy Spring Boot Deployment with AWS Elastic Beanstalk](/blog/2019/08/07/deploy-a-spring-boot-app-with-aws-elastic-beanstalk)
* [AWS Lambda vs Azure Functions for C# Serverless](/blog/2019/05/20/azure-aws-lambda-functions-serverless-csharp)

To make sure you never miss any of our killer content, make sure to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://youtube.com/c/oktadev)!

Go out there and explore your data fearlessly!
