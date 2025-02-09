from dotenv import load_dotenv
import requests
import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import SecretStr
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, MessagesState, StateGraph

load_dotenv()

API_TOKEN = os.getenv("OPENAI_API_KEY")
MODEL = "gpt-4o"
headers = {"Authorization": f"Bearer {API_TOKEN}"}

workflow = StateGraph(state_schema=MessagesState)

def chatbot_test(arr):
    MODEL = 'gpt-4o-2024-08-06' 
    history_context = ''.join(arr[:-1])
    current_context = arr[-1]
    messages = [
    HumanMessage(content=f'You are a disaster information and help chatbot now and will respond like one. This is the chat history of the user with the chatbot: {history_context}. The question that the user asked is: {current_context}')
]
    client = ChatOpenAI(api_key=SecretStr(str(API_TOKEN)), base_url='https://api.openai.com/v1' ,model=MODEL)
    llm_response = client.invoke(messages)
    return llm_response.content

workflow.add_edge(START, "model")
workflow.add_node("model", chatbot_test)

# Add memory
memory = MemorySaver()
app = workflow.compile(checkpointer=memory)

if __name__ == '__main__':
    input_conversations = ["what are stocks in finance", "ok so in which stock should i apply for" , "tell some famous stocks of india"]
    print(chatbot_test(input_conversations))
    # print(fetch_financial_tips())
