from groq import Groq

client = Groq(
    api_key="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"
)
completion = client.chat.completions.create(
    model="llama3-8b-8192",
    messages=[
        {
            "role": "user",
            "content": "can you determine it the following sentence is positive or negative? 'I am too young to do this' \n"
        }
    ],
    temperature=1,
    max_tokens=1024,
    top_p=1,
    stream=True,
    stop=None,
)

for chunk in completion:
    print(chunk.choices[0].delta.content or "", end="")
