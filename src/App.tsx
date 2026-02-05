import { useState } from 'react'

type Message = {
    role: 'user' | 'ai';
    content: string;
    sql?: string;
    data?: any[];
};

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

// ... imports and types (unchanged from previous step if I don't touch them) ...
// But since I'm replacing the whole component logic block often, I'll validly just replace the text parts inside the function.
// Let's target the component function specifically or just the variable definitions if possible, but the code block here is safer.

function App() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: 'مرحباً، أنا المساعد الذكي لبيانات المنظمة. يمكنك سؤالي عن أي شيء يخص المشاريع.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const suggestedQuestions = [
        "كم عدد المشاريع المتأخرة؟",
        "اعرض قائمة بمشاريع قسم تقنية المعلومات",
        "ما هي ميزانية عام 2024؟",
        "من هو المورد الأكثر عقوداً؟"
    ];

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert("التعرف على الصوت غير مدعوم في هذا المتصفح. يرجى استخدام كروم.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'ar-SA';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: text }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch');
            }

            const aiMsg: Message = {
                role: 'ai',
                content: data.answer,
                sql: data.sql,
                data: data.data
            };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error: any) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'ai', content: `خطأ: ${error.message}. تأكد من تشغيل الخادم.` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container" dir="rtl">
            <header className="header">
                <h1>🏛️ نظام استعلام مشاريع المنظمة</h1>
                <p>الوصول الآمن للبيانات عبر الذكاء الاصطناعي</p>
            </header>

            <div className="chat-container">
                <div className="messages-area">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message-bubble ${msg.role}`}>
                            <div className="message-content">{msg.content}</div>
                            {msg.sql && (
                                <details className="sql-details">
                                    <summary>عرض استعلام قاعدة البيانات (للشفافية)</summary>
                                    <pre>{msg.sql}</pre>
                                </details>
                            )}
                        </div>
                    ))}
                    {isLoading && <div className="message-bubble ai loading">جاري التفكير...</div>}
                </div>

                <div className="input-area">
                    <div className="suggestions">
                        {suggestedQuestions.map((q, idx) => (
                            <button key={idx} onClick={() => sendMessage(q)} disabled={isLoading}>
                                {q}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="input-form">
                        <button
                            type="button"
                            onClick={startListening}
                            className={`mic-button ${isListening ? 'listening' : ''}`}
                            title="تحدث"
                            disabled={isLoading}
                        >
                            {isListening ? '🔴' : '🎤'}
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="اطرح سؤالاً عن مشاريع المنظمة..."
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading}>إرسال</button>
                    </form>
                </div>
            </div>
        </div>
    )
} // end App

export default App
