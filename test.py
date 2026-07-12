import google.generativeai as genai
import time
import os

start = time.time()
genai.configure(api_key='AQ.Ab8RN6IwNpSMZUYt5iVvNXyDRc9CulV3eIiofri9waUtDl8ARg')
model = genai.GenerativeModel('gemini-1.5-flash')
try:
    print("Testing generate_content...")
    model.generate_content('hi')
except Exception as e:
    print(f'Failed in {time.time()-start:.2f}s: {e}')
