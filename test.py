import requests
import json

# Define the URL
url = "http://localhost:8080/transcribe"

# Define the headers for the POST request
headers = {
    'Content-Type': 'application/json'
}

# Define the data for the POST request
data = {
    'transcript': 'Hello, this is a test message',
    'lat': 40.7128,  # Replace with actual latitude
    'long': -74.0060  # Replace with actual longitude
}

# Send the POST request
response = requests.post(url, headers=headers, data=json.dumps(data))

# Print the response
print(f'Response status code: {response.status_code}')
print(f'Response content: {response.json()}')

# Define the URL for the chatbot message
url_chatbot = "http://localhost:8080/message"

# Define the data for the POST request to the chatbot
data_chatbot = {
    'message': 'Hello, this is a test message for the chatbot'
}

# Send the POST request to the chatbot
response_chatbot = requests.post(url_chatbot, headers=headers, data=json.dumps(data_chatbot))

# Print the response from the chatbot
print(f'Chatbot response status code: {response_chatbot.status_code}')
print(f'Chatbot response content: {response_chatbot.json()}')