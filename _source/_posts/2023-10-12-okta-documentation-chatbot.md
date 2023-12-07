---
layout: blog_post
title: "How to Build an Okta Documentation Chatbot in Python"
author: tanish-kumar
by: internal-contributor
communities: [python]
description: "Build a Python chatbot to quickly access information from Okta's documentation."
tags: [python-chatbot, python, okta documentation, ai, automation]
tweets:
- ""
image: blog/okta-documentation-chatbot/oktanaut.jpeg
type: awareness
---

In today's fast-paced world of technology, developer support is essential to ensure a seamless experience for users navigating intricate platforms and APIs. As a Developer Support Intern at Okta, I embarked on a challenging yet rewarding endeavor to create a solution that would streamline accessing and comprehending the Okta developer documentation. The result of my efforts is ✨Oktanaut✨, a versatile Python chatbot designed to assist users in harnessing the power of Okta's developer documentation, available at [developer.okta.com](https://developer.okta.com). 

{% img blog/okta-documentation-chatbot/oktadevforumsdk.jpeg alt:"oktadevforumsdk" height:"400" %}{: .center-image } 
– Image source: <cite>[Okta Developer GitHub](https://raw.githubusercontent.com/oktadev/.github/main/images/okta-dev-header.png)</cite> 

## Navigating Uncharted Waters
Learning to build a chatbot was a formidable challenge. I spent hours scouring Medium articles, sifting through Coursera courses, and experimenting with various libraries and APIs. Determined, I delved into the world of chatbot development, driven by a desire to create a valuable tool for the Okta community.

## Evolution of a Python Chatbot
My journey led me to develop two distinct versions of Oktanaut a Python chatbot. The first version harnessed the capabilities of the GPT-3.5 API, allowing it to generate responses based on a broad spectrum of user inquiries. This version could handle various questions, providing a dynamic interaction experience.

{% img blog/okta-documentation-chatbot/api.jpeg alt:"api-image" height:"400" %}{: .center-image }
– Image source: <cite>[OpenAI APIs with Python — Complete Guide](https://medium.com/@marc.bolle/openai-apis-with-python-complete-guide-d933fb770f95)</cite>

The second version took a different approach. Using LLamaIndex, I crafted a custom chatbot exclusively trained on the Okta developer documentation. While this version's responses were more accurate due to its focused training, it needed to be more comprehensive in handling a diverse range of questions compared to the GPT-3.5-powered counterpart.

## Precision vs. Versatility
The trade-off between precision and versatility became evident when comparing the two versions. The GPT-3.5-powered Oktanaut could generate responses to a broader set of questions, but the LLamaIndex-based version excelled in accuracy. Both played a crucial role in catering to different user needs.

## Meticulous Training for Enhanced Performance
For both versions, meticulous training was the cornerstone of success. I diligently fed the chatbots with carefully curated sample questions, answers, and information provided by developer support engineers. Doing so enabled Oktanaut to connect users seamlessly to human engineers in cases where its responses fell short of expectations.
Additionally, by storing historical interactions, I transformed Oktanaut into a self-learning entity. This self-improvement mechanism allowed the chatbot to utilize context information from past conversations to provide more informed responses.

## Personalizing the Experience
Introducing context information at the beginning of conversations allowed Oktanaut to greet users with an understanding of its name, functionality, and purpose. It also added a personal touch and minimized any initial confusion users might have had.

## The Power of Panels: Crafting the User Interface
Python's Panels library proved to be a wise choice for creating the front end of Oktanaut. Its seamless integration with Python made the development process smoother. The synergy between Oktanaut's Python-based backend and the Panels-powered frontend ensured a cohesive and user-friendly experience.

## Demonstrating Oktanaut's Potential
The completed chatbot script can be found [here](https://github.com/tanishkumar02/oktanaut/).  

```py
def continue_conversation(messages, temperature=0):
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages,
        temperature=temperature,
    )
    #print(str(response.choices[0].message["content"]))
    return response.choices[0].message["content"]
```

```py
def add_prompts_conversation(_):
    prompt = client_prompt.value_input
    client_prompt.value = ''

    context.append({'role':'user', 'content':f"{prompt}"})

    response = continue_conversation(context)

    context.append({'role':'assistant', 'content':f"{response}"})

    panels.append(
        pn.Row('Developer:', pn.pane.Markdown(prompt, width=600)))
    panels.append(
        pn.Row('Oktanaut:', pn.pane.Markdown(response, width=600)))

    return pn.Column(*panels)
```

```py
context = [ {'role':'system', 'content':"""'I am Oktanaut, a helpful chatbot meant to answer your questions about Okta and OAuth developer documentation. I answer questions from Okta developer documentation. How may I help you? (Say "thank you" to end the session) \n'"""} ]

pn.extension()

panels = []

client_prompt = pn.widgets.TextInput(value="Hi", placeholder='Enter your questions here...')
button_conversation = pn.widgets.Button(name="Chat with Oktanaut!")

interactive_conversation = pn.bind(add_prompts_conversation, button_conversation)

dashboard = pn.Column(
    client_prompt,
    pn.Row(button_conversation),
    pn.panel(interactive_conversation, loading_indicator=True),
)

dashboard
```
The code above found in the [main/GPTChatbot.ipynb](https://github.com/tanishkumar02/oktanaut/blob/main/GPTChatbot.ipynb) file is a script for a Python chatbot "Oktanaut" that can answer questions about Okta and OAuth developer documentation. The chatbot is built using the GPT-3.5 Turbo model from OpenAI and displayed in a web interface created with the Python panel library.

Here's a step-by-step walkthrough of how the code works and how to use it:
1. With a Google account, ensure you have access to [Colab](https://colab.google/); this will be the environment we will use to run the Python scripts. 
2. Library installation: The script begins with installing the required Python packages: [OpenAI](https://pypi.org/project/openai/), [Panel](https://panel.holoviz.org/getting_started/installation.html), and [LlamaIndex](https://pypi.org/project/llama-index/). These packages work with the GPT-3.5 model, create the web interface, and manage the chatbot's conversation.

3. Get an OpenAI API key by creating an account and following these [instructions](https://help.openai.com/en/articles/4936850-where-do-i-find-my-api-key). Replace the API Key code snippet with your API Key. 

{% img blog/okta-documentation-chatbot/openai-api-key.jpeg alt:"openai-api-key" height:"400" %}{: .center-image }

3. Download the Okta documentation files from my shared Google Drive folder [here](https://drive.google.com/drive/folders/11W-cjmkTztmnGgJCsJRtE395Iji6JX53?usp=share_link) and make sure the files are saved in a 
 separate folder on your drive (not within any folders) and you are mounting the files from your Google account. Make sure the name of the folder is 'oktanaut'.

4. continue_conversation: This function takes a list of messages as input and continues the conversation with the GPT-3.5 Turbo model. It sends the messages to the model and receives a response.

    - model="gpt-3.5-turbo": Specifies the GPT-3.5 Turbo model for conversation.
    - messages: The list of messages that make up the conversation.
    - temperature: A parameter that controls the randomness of the model's responses.

5. add_prompts_conversation: This function adds prompts to the conversation and retrieves responses from the chatbot. It's triggered by clicking on the web interface.

6. The user enters a prompt in the client_prompt input field.

7. The user's input is added to the conversation with the role "user."

8. The continue_conversation function is called to get the chatbot's response.

9. The chatbot's response is added to the conversation with the role "assistant."

10. context list: This list initializes the conversation with a system message that introduces Oktanaut, the chatbot. It provides information about the bot's purpose and capabilities.

11. pn.extension(): This line initializes the Panel extension, enabling the creation of the web-based user interface.

12. panels list: This list will store the components displayed in the web interface.

13. client_prompt input field: This widget allows users to input their questions or prompts for Oktanaut.

14. button_conversation: This is the button to submit the user's question and trigger the conversation with Oktanaut.

15. interactive_conversation function binding: This line binds the add_prompts_conversation function to the button_conversation button, making it interactive and responsive to user input.

16. dashboard layout: This section assembles the user interface, including the input field, the conversation button, and the chatbot's responses.

Now, here's how to use the code:

1. Run the Python script in your Colab development environment.

2. After running the script, a web interface will be displayed, including an input field and a "Chat with Oktanaut!" button.

3. Enter your questions or prompts in the input field. For example, you can ask about Okta or OAuth developer documentation.

4. To submit your question, click the "Chat with Oktanaut!" button.

5. Oktanaut will respond to your question with a chatbot-generated answer.

6. You can continue the conversation by entering additional questions or prompts and clicking the button.

7. To end the session, you can say "thank you," as mentioned in the introductory message.

8. The chatbot will answer questions and converse based on your prompts. It uses the GPT-3.5 Turbo model to generate responses.

Note: The conversation and responses will appear on the web interface in real-time.

The web interface allows you to have interactive conversations with Oktanaut and receive answers to your questions about Okta and OAuth developer documentation. Feel free to try it out and have a conversation with Oktanaut!

{% img blog/okta-documentation-chatbot/openai-oidc.jpeg alt:"openai-oidc" height:"400" %}{: .center-image }

## Expanding Horizons
My journey with Oktanaut further continues! I am enthusiastic about enhancing its capabilities by integrating data from the Okta Dev Forum and addressing issues from Okta's GitHub SDK. Collaborating with the Developer Documentation team to discuss potential implementations is also on the horizon, ensuring Oktanaut evolves into an indispensable asset for Okta developers.

In conclusion, the creation of Oktanaut was a transformative experience that blended technological exploration with real-world application. From tackling the complexities of chatbot development to harnessing the power of AI and precision training, Oktanaut stands as a testament to the potential that diligent learning and innovation can unlock. As my journey continues, I look forward to witnessing Oktanaut's impact on the developer community and the realm of developer support.

Got questions? You can leave them in the comments below! Want to stay in touch? Follow our social channels: @oktadev on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) channel.

