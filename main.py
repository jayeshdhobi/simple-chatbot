from flask import Flask, request, jsonify, render_template
from flask_pymongo import PyMongo
from datetime import datetime
import os
from dotenv import load_dotenv
from groq import Groq

app = Flask(__name__)

load_dotenv()

app.config["MONGO_URI"] = "mongodb://localhost:27017/main"
mongo = PyMongo(app)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.route('/')
def index():
    myChats = mongo.db.chats.find().sort("timestamp", -1)
    return render_template('index.html', myChats=myChats)

@app.route('/api', methods=['POST'])
def api():
    data = request.get_json()
    question = data.get('question')
    model = data.get('model', 'llama3-8b-8192')  # Default model if none provided

    if not question:
        return jsonify({"error": "No question provided"}), 400

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": question,
                }
            ],
            model=model,
        )
        answer = chat_completion.choices[0].message.content

        mongo.db.chats.insert_one({
            "question": question,
            "answer": answer,
            "timestamp": datetime.utcnow()
        })

        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chats', methods=['GET'])
def get_chats():
    search_query = request.args.get('search', '')
    try:
        if search_query:
            chats = mongo.db.chats.find({
                "$or": [
                    {"question": {"$regex": search_query, "$options": "i"}},
                    {"answer": {"$regex": search_query, "$options": "i"}}
                ]
            }).sort("timestamp", -1)
        else:
            chats = mongo.db.chats.find().sort("timestamp", -1)
        
        chats_list = [
            {
                "_id": str(chat["_id"]),
                "question": chat["question"],
                "answer": chat["answer"],
                "timestamp": chat["timestamp"].strftime("%Y-%m-%d %H:%M:%S")
            }
            for chat in chats
        ]
        return jsonify(chats_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chats/<chat_id>', methods=['DELETE'])
def delete_chat(chat_id):
    try:
        result = mongo.db.chats.delete_one({"_id": ObjectId(chat_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Chat not found"}), 404
        return jsonify({"message": "Chat deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chats/clear', methods=['DELETE'])
def clear_chats():
    try:
        mongo.db.chats.delete_many({})
        return jsonify({"message": "All chats cleared successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)


