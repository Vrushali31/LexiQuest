# 🧠 LexiQuest — Chrome Extension
![image](https://github.com/user-attachments/assets/ea19a901-489e-4eed-b1d3-5a05253fd11e)
[![Watch the demo](https://img.youtube.com/vi/9kQodDaTzBQ/hqdefault.jpg)](https://www.youtube.com/watch?v=9kQodDaTzBQ)

### *Your AI-Powered Learning Assistant*

LexiQuest transforms your daily browsing into meaningful language learning moments.  
Highlight any text — and instantly **translate**, **simplify**, and **analyze** it using built-in Gemini Nano APIs.  

This smart extension goes beyond translation — it helps you *learn through life, not just lessons.*

---

## ✨ Features

- 🌍 **Translate** text into your target language (English by default)  
- 🪶 **Simplify** complex phrases into plain, learner-friendly language  
- 🧩 **Explain Grammar & Key Concepts** using AI reasoning  
- 🧠 **Generate Quizzes** for deeper retention  
- 📘 **Save quizzes to your Notebook** for later review  
- 📊 **AI Skill Graph Analysis** automatically visualizes learning progress  

All features run using **on-device Gemini Nano APIs** for privacy, speed, and offline availability:  
**Prompt**, **Translator**, **Rewriter**, **Summarizer**, and **Language Detector APIs**.

---

## ⚙️ How to Load Locally (Development)

1. Clone or copy this folder to your machine.  
2. Open **Chrome** (preferably a version with built-in AI or **Canary**).  
3. Go to `chrome://extensions`.  
4. Enable **Developer mode** (top-right).  
5. Click **Load unpacked** → select the `LexiQuest/` folder.  
6. Open any web page → highlight text → click the **LexiQuest** icon.  
7. The selected text appears in the popup — click **Translate**, **Simplify**, or **Explain**.

---

## 🔗 Where to Plug in Real Gemini Nano Calls

Replace the placeholder implementations in  
`gemini/gemini-nano.js`  
with the actual built-in API calls from your hackathon environment.  

Each function should return a **plain text string** (translation, simplification, explanation, etc.).

---

## 🧩 How It Works

When users highlight text and select an action (Translate , Simplify, Enhance, or Generate Quiz),  
LexiQuest uses the Gemini Nano APIs to process the content locally.  
Once a quiz is saved, **LexiQuest automatically analyzes quiz performance data** to update  
your personalized **Skill Graph**, showing growth across grammar, vocabulary, and comprehension.

---

## 🛠️ Built With

- HTML, CSS, JavaScript  
- Chrome Built-in Gemini Nano APIs  
  - **Prompt API**  
  - **Translator API**  
  - **Rewriter API**  
  - **Language Detector API**

---

## 🧠 Vision

LexiQuest aims to make language learning feel natural and contextual —  
turning everyday reading into micro-learning experiences.  
No separate app, no distractions — just smarter browsing.

---
