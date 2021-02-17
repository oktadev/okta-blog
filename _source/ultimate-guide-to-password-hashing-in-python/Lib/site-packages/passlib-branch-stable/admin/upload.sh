#!/bin/sh
#
# helper script to build & upload passlib to pypi
#

SEP1="====================================================="
SEP2="-----------------------------------------------------"

#
# init config
#

export SETUP_TAG_RELEASE=no

if [ -z "$DRY_RUN" ]; then
    echo "DRY_RUN not set (0 or 1)"
    exit 1
elif [ "$DRY_RUN" -eq 1 ]; then
    echo "dry run"
    UPLOAD_ARG=""
    UPLOAD_DOCS_ARG=""
else
    echo "real run"
    UPLOAD_ARG="upload"
    UPLOAD_DOCS_ARG="upload_docs"
fi

VSTR=`python setup.py --version`
VTAIL="Release-${VSTR}"

echo "$SEP1"
echo "DRY_RUN=$DRY_RUN"
echo "VERSION=$VSTR"

#
# upload to pypi
#
if [ -z "$SKIP_PYPI" ]; then

    # clean dir
    echo "\n$SEP1\ncleaning build dirs\n$SEP2"
    rm -rf build dist

    # upload source
    echo "\n$SEP1\nbuilding and uploading source to pypi\n$SEP2"
    python setup.py sdist bdist_wheel $UPLOAD_ARG

    # upload docs
    echo "\n$SEP1\nbuilding and uploading docs to pypi\n$SEP2"
    SPHINX_BUILD_TAGS="for-pypi" python setup.py build_sphinx $UPLOAD_DOCS_ARG

fi

echo "\n$SEP1\ndone."
