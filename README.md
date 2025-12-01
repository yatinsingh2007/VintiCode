# VintiCode

VintiCode is a full-stack web application containing both a **frontend** and a **backend** codebase.  
This repository is structured to keep the UI and API layers modular, scalable, and easy to maintain.

---

## 🚀 Project Structure

```md
vinticode/
├── vinitcode-frontend/ # Client-side application
├── allgrow-backend/ # Server-side API & database logic
├── README.md
```


---

## 🛠️ Tech Stack

### **Frontend**
- HTML, CSS, TypeScript
- React / Next.js *(update if needed)*
- Axios or Fetch for API requests

### **Backend**
- Node.js + Express  
- Prisma ORM  
- PostgreSQL
- JWT Authentication  
- REST API architecture  

---

## 📦 Installation & Setup

### **1️⃣ Clone the Repository**
```bash
git clone https://github.com/<your-username>/vinticode.git
cd vinticode
```
## Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
## .env.local for frontend
```bash
NEXT_PUBLIC_API_BASE_URL="https://vinti-code.vercel.app"
```

### ⚙️ Judge0 Integration (Backend)

The backend uses **RapidAPI headers** to securely communicate with the **Judge0 API** for executing user-submitted code.  
The frontend sends the code, language ID, and input to the backend, and the backend forwards these details to Judge0 using RapidAPI authentication.  
Judge0 processes the code and returns the output, which is then sent back to the frontend.
