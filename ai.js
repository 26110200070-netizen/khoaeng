// KhoaEng AI Engine
// Powered by Groq API (openai/gpt-oss-20b)

const KHOA_DEFAULT_API_KEY = "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";
const KHOA_DEFAULT_MODEL = "openai/gpt-oss-20b";
const KHOA_API_URL = "https://api.groq.com/openai/v1/chat/completions";

class KhoaEngAI {
    constructor() {
        this.apiKey = localStorage.getItem('khoaeng_api_key') || KHOA_DEFAULT_API_KEY;
        this.model = localStorage.getItem('khoaeng_model') || KHOA_DEFAULT_MODEL;
    }

    setApiKey(key) {
        this.apiKey = key ? key.trim() : KHOA_DEFAULT_API_KEY;
        localStorage.setItem('khoaeng_api_key', this.apiKey);
    }

    setModel(model) {
        this.model = model ? model.trim() : KHOA_DEFAULT_MODEL;
        localStorage.setItem('khoaeng_model', this.model);
    }

    getApiKey() {
        return this.apiKey;
    }

    getModel() {
        return this.model;
    }

    // Call Groq Chat Completions API
    async callGroq(messages, options = {}) {
        const payload = {
            model: options.model || this.model,
            messages: messages,
            temperature: options.temperature !== undefined ? options.temperature : 0.6,
            max_tokens: options.max_tokens || 3500
        };

        if (options.jsonMode) {
            payload.response_format = { type: "json_object" };
        }

        const response = await fetch(KHOA_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let errDetail = "";
            try {
                const errJson = await response.json();
                errDetail = errJson.error?.message || JSON.stringify(errJson);
            } catch (e) {
                errDetail = response.statusText;
            }
            throw new Error(`Groq API Error (${response.status}): ${errDetail}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    }

    // 1. Generate Authentic THPT 2026 English Exam
    // 1. Generate Authentic THPT 2026 English Exam (Supports Exclusive Focus Mode & Translations)
    async generateExam(questionCount = 12, customRequirements = "", historySignatures = [], isFocusOnly = false, focusTopics = []) {
        const count = Math.min(Math.max(parseInt(questionCount) || 12, 12), 20);

        const systemPrompt = `Bạn là Chuyên gia Khảo thí Tiếng Anh hàng đầu Việt Nam, am hiểu sâu sắc Chương trình GDPT 2018 và định dạng Đề thi Tốt nghiệp THPT môn Tiếng Anh mới nhất năm 2025 - 2026 của Bộ Giáo dục và Đào tạo.

QUY CÁCH ĐỀ THI THPT 2026:
Đề thi mới tập trung vào năng lực ngôn ngữ ứng dụng thực tế:
1. Đọc điền thông báo/quảng cáo/tờ rơi (Announcement / Advertisement / Leaflet)
2. Sắp xếp các câu (Sentence / Exchange Sequencing)
3. Đọc điền khuyết thông tin (Reading Cloze)
4. Đọc hiểu văn bản (Reading Comprehension)
5. Ứng dụng ngữ pháp & từ vựng trọng điểm

QUY TẮC BẮT BUỘC:
- Số lượng câu hỏi: ĐÚNG ${count} câu.
- Mỗi câu có 4 phương án A, B, C, D rõ ràng, CHỈ CÓ 1 ĐÁP ÁN ĐÚNG DUY NHẤT.
- Format trường "options": Mảng 4 phần tử có tiền tố "A. ...", "B. ...", "C. ...", "D. ...".
- Trường "correct": Chỉ ghi 1 ký tự viết hoa: "A", "B", "C", hoặc "D".
- Trường "category": Chọn 1 trong 5 nhóm: "Ngữ pháp", "Từ vựng", "Đọc thông báo", "Sắp xếp câu", "Đọc hiểu".
- Trường "context": Đoạn văn ngắn, thông báo hoặc ngữ cảnh tiếng Anh nếu có (nếu là câu đơn lẻ thì để trống chuỗi rỗng "").
- Trường "context_vi": Bản dịch tiếng Việt chuẩn xác, tự nhiên của ngữ cảnh/đoạn văn trên (nếu context rỗng thì "").
- Trường "question": Nội dung câu hỏi tiếng Anh.
- Trường "question_vi": Bản dịch tiếng Việt chuẩn xác của câu hỏi tiếng Anh để người học hiểu đề khi bấm nút "Dịch".
- Trường "explanation": Giải thích cặn kẽ bằng tiếng Việt, phân tích ngữ pháp, dịch câu, lý do chọn phương án đúng và loại phương án sai.
- Trường "topic": Tên chuyên đề kiến thức (ví dụ: "Thì quá khứ hoàn thành", "Câu bị động kép", "Mạo từ a/an/the", "Sắp xếp thư tín").

YÊU CẦU ĐỘC NHẤT & KHÔNG TRÙNG LẶP:
Tuyệt đối KHÔNG sao chép đề cũ. Tự sáng tạo ngữ liệu mới 100%, tự nhiên, hiện đại năm 2026.

Bạn PHẢI trả về duy nhất một JSON object hợp lệ theo schema sau:
{
  "examTitle": "Đề Luyện Thi THPT 2026 - KhoaEng",
  "totalQuestions": ${count},
  "questions": [
    {
      "id": 1,
      "category": "Đọc thông báo" | "Ngữ pháp" | "Từ vựng" | "Sắp xếp câu" | "Đọc hiểu",
      "context": "English passage or announcement if any (else '')",
      "context_vi": "Bản dịch tiếng Việt của ngữ cảnh (nếu có; else '')",
      "question": "English question text",
      "question_vi": "Bản dịch tiếng Việt chuẩn của câu hỏi",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct": "A",
      "explanation": "Giải thích chi tiết bằng tiếng Việt...",
      "topic": "Tên chủ điểm kiến thức"
    }
  ]
}`;

        let historyInstruction = "";
        if (historySignatures && historySignatures.length > 0) {
            const recentTopics = historySignatures.slice(-15).join("; ");
            historyInstruction = `\nĐẶC BIỆT LƯU Ý TRÁNH TRÙNG LẶP: Trước đó học sinh đã làm các câu hỏi liên quan đến: [${recentTopics}]. BẠN PHẢI TẠO NỘI DUNG HOÀN TOÀN MỚI, KHÔNG LẶP LẠI CÁC NGỮ CẢNH HAY VÍ DỤ NÀY!`;
        }

        let userRequirementInstruction = "";
        if (isFocusOnly) {
            let focusList = Array.isArray(focusTopics) ? focusTopics.join(", ") : (focusTopics || "");
            if (customRequirements && customRequirements.trim()) {
                focusList += (focusList ? ", " : "") + customRequirements.trim();
            }
            if (!focusList) focusList = "Ngữ pháp và dạng bài trọng điểm";

            userRequirementInstruction = `\n🚨🚨🚨 CHẾ ĐỘ BẮT BUỘC: "CHỈ TẬP TRUNG" (EXCLUSIVE FOCUS MODE)
Người học yêu cầu: CHỈ TẬP TRUNG 100% VÀO DUY NHẤT CÁC CHUYÊN ĐỀ / DẠNG BÀI SAU:
"${focusList}"

QUY TẮC SỐNG CÒN:
- TẤT CẢ ĐÚNG ${count} CÂU HỎI TRONG ĐỀ THI ĐỀU PHẢI 100% CHỈ THUỘC VỀ VÀ KIỂM TRA CÁC DẠNG BÀI / CHUYÊN ĐỀ ĐƯỢC NÊU Ở TRÊN!
- TUYỆT ĐỐI KHÔNG TẠO BẤT KỲ CÂU HỎI NÀO NGOÀI CÁC CHUYÊN ĐỀ ĐÃ NÊU!`;
        } else if (customRequirements && customRequirements.trim()) {
            userRequirementInstruction = `\nYÊU CẦU THÊM TỪ HỌC SINH (ƯU TIÊN LỒNG GHÉP VÀO CÁC CÂU HỎI TRONG ĐỀ):
"${customRequirements.trim()}"
Hãy đảm bảo phần lớn các câu hỏi trong đề xoáy sâu vào các chuyên đề mà học sinh đã yêu cầu ở trên!`;
        }

        const userPrompt = `Hãy tạo một đề thi gồm ĐÚNG ${count} câu trắc nghiệm tiếng Anh THPT 2026 chuẩn chương trình mới.${userRequirementInstruction}${historyInstruction}
Đảm bảo độ phân hóa tốt, giải thích chi tiết, kèm cả context_vi và question_vi để học sinh dịch hiểu đề, format JSON hợp lệ 100%.`;

        try {
            const raw = await this.callGroq([
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ], { jsonMode: true, temperature: 0.65, max_tokens: 4200 });

            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
                // Ensure correct formatting
                parsed.questions = parsed.questions.map((q, idx) => ({
                    id: idx + 1,
                    category: q.category || "Ngữ pháp",
                    context: q.context || "",
                    context_vi: q.context_vi || "",
                    question: q.question || `Câu hỏi số ${idx + 1}`,
                    question_vi: q.question_vi || "",
                    options: Array.isArray(q.options) && q.options.length === 4 ? q.options : [
                        "A. Option A", "B. Option B", "C. Option C", "D. Option D"
                    ],
                    correct: (q.correct || "A").toString().trim().toUpperCase().charAt(0),
                    explanation: q.explanation || "Giải thích đang được cập nhật.",
                    topic: q.topic || "Ngữ pháp THPT"
                }));
                parsed.totalQuestions = parsed.questions.length;
                return parsed;
            } else {
                throw new Error("Phản hồi JSON không chứa danh sách câu hỏi hợp lệ");
            }
        } catch (err) {
            console.warn("AI generation error, falling back to curated authentic question bank:", err);
            return getCuratedExam(count, customRequirements, isFocusOnly, focusTopics);
        }
    }

    // 2. Generate Pedagogical Hint ("Hướng dẫn từ Khoa Eng") - ABSOLUTELY NO DIRECT ANSWER
    async generateHint(questionItem) {
        const systemPrompt = `Bạn là thầy Khoa Eng - Gia sư Tiếng Anh luyện thi THPT Quốc Gia 2026 tận tâm, truyền cảm hứng và sắc bén.

Học sinh đang làm bài thi và nhấn nút "Hướng dẫn từ Khoa Eng".
NHIỆM VỤ CỦA BẠN: Hướng dẫn học sinh phương pháp tư duy, cách tiếp cận để tự tìm ra đáp án đúng.

🚨 QUY TẮC SỐ 1 - BẤT DI BẤT DỊCH:
- TUYỆT ĐỐI KHÔNG ĐƯỢC NÓI RA ĐÁP ÁN (Không được nói "chọn A", "đáp án là C", hay chỉ thẳng từ đúng)!
- Không ghi ký tự đáp án đúng (A/B/C/D). Mục tiêu là dạy học sinh CÁCH CÂU CÁ chứ không cho con cá!

CẤU TRÚC BÀI HƯỚNG DẪN (Định dạng Markdown đẹp mắt, chuẩn chỉnh, thân thiện):
### 🎯 Trọng tâm kiến thức
(Xác định câu này đang kiểm tra chuyên đề gì: thì động từ, câu bị động, mạo từ, đảo ngữ, cấu trúc câu, hay nghĩa ngữ cảnh...)

### 🔍 Dấu hiệu nhận biết & Từ khóa (Keywords)
(Chỉ ra các từ hoặc cụm từ then chốt trong câu gợi ý cách chia hoặc chọn phương án)

### 💡 Bước suy luận & Loại trừ
- **Bước 1**: Nhìn vào... để loại ngay các phương án vô lý.
- **Bước 2**: Xem xét sự hòa hợp giữa...
- **Bước 3**: Chú ý cấu trúc chuẩn: *[Nêu công thức tổng quát nếu có]*

### ⚠️ Bẫy cần tránh
(Cảnh báo những lỗi sai phổ biến mà thí sinh THPT hay mắc phải ở câu này)

> **Lời khuyên từ Khoa Eng**: (Một câu ngắn khích lệ học sinh tự tin chọn đáp án!)

Dùng tiếng Việt chuẩn mực, xưng "Thầy Khoa" hoặc "Khoa Eng" và gọi "em" hoặc "bạn".`;

        const userPrompt = `Hãy hướng dẫn em làm câu trắc nghiệm này mà KHÔNG ĐƯỢC TIẾT LỘ ĐÁP ÁN:
${questionItem.context ? `Ngữ cảnh / Bài đọc:\n${questionItem.context}\n\n` : ''}Câu hỏi: ${questionItem.question}
Các phương án:
${questionItem.options.join("\n")}
Chủ điểm: ${questionItem.topic || questionItem.category}`;

        try {
            const hintMarkdown = await this.callGroq([
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ], { temperature: 0.5, max_tokens: 1200 });
            return hintMarkdown;
        } catch (err) {
            console.error("Hint generation failed:", err);
            return generateOfflineHint(questionItem);
        }
    }

    // 3. Analyze Test Performance (Strengths, Weaknesses, Diagnostic Chart Data)
    async analyzePerformance(exam, userAnswers, score, timeSpentSeconds) {
        const correctCount = userAnswers.filter((ans, idx) => ans === exam.questions[idx].correct).length;
        const total = exam.questions.length;
        const wrongQuestions = [];
        const correctQuestions = [];

        exam.questions.forEach((q, idx) => {
            const userChoice = userAnswers[idx] || "Chưa chọn";
            const isCorrect = userChoice === q.correct;
            const item = {
                id: q.id,
                category: q.category,
                topic: q.topic,
                question: q.question,
                userChoice,
                correctChoice: q.correct
            };
            if (isCorrect) correctQuestions.push(item);
            else wrongQuestions.push(item);
        });

        const systemPrompt = `Bạn là thầy Khoa Eng - Chuyên gia phân tích năng lực Tiếng Anh THPT Quốc gia theo chuẩn 2026.
Nhiệm vụ: Phân tích kết quả thi của học sinh, chỉ ra chính xác điểm mạnh, lỗ hổng kiến thức cần khắc phục, và lộ trình ôn tập cá nhân hóa.

Định dạng trả về PHẢI là Markdown chuẩn mực, sinh động, truyền động lực, có chia các mục:
## 📊 Đánh giá tổng quan
(Nhận xét số điểm ${score}/10, thời gian hoàn thành ${Math.floor(timeSpentSeconds / 60)} phút ${timeSpentSeconds % 60} giây)

## 🌟 Điểm mạnh đã thể hiện
(Nêu rõ học sinh đã làm tốt các mảng kiến thức nào dựa trên các câu đúng)

## ⚠️ Lỗ hổng & Điểm cần cố gắng
(Phân tích cặn kẽ các câu bị làm sai, chỉ ra học sinh đang yếu ở thì nào, cấu trúc nào, hay kỹ năng phân tích nào)

## 🎯 Kế hoạch hành động bứt phá (Action Plan THPT 2026)
(3-4 lời khuyên hành động thực chiến để nâng điểm trong các đề tiếp theo)

## 💬 Lời nhắn từ Khoa Eng
(Lời chúc và động viên tinh thần chân thành)`;

        const userPrompt = `Dữ liệu bài thi vừa hoàn thành:
- Số câu đúng: ${correctCount}/${total}
- Điểm số: ${score}/10
- Thời gian làm: ${timeSpentSeconds} giây
- Danh sách câu làm ĐÚNG (${correctQuestions.length} câu):
${correctQuestions.map(q => `- Câu ${q.id} [${q.category}]: ${q.topic}`).join("\n")}
- Danh sách câu làm SAI / CHƯA CHỌN (${wrongQuestions.length} câu):
${wrongQuestions.map(q => `- Câu ${q.id} [${q.category} - ${q.topic}]: Bạn chọn ${q.userChoice}, Đáp án đúng là ${q.correctChoice}`).join("\n")}

Hãy viết bài phân tích chuyên sâu chi tiết giúp em!`;

        try {
            const analysis = await this.callGroq([
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ], { temperature: 0.6, max_tokens: 1600 });
            return analysis;
        } catch (err) {
            console.warn("AI analysis failed, generating smart dynamic template:", err);
            return generateOfflineAnalysis(score, correctCount, total, wrongQuestions, correctQuestions);
        }
    }

    // 4. Chat with AI Tutor "Khoa Eng"
    async chatWithKhoaEng(userMessage, messageHistory = []) {
        const systemPrompt = `Bạn là "Khoa Eng" - Trợ lý AI và Gia sư Tiếng Anh thông minh, thân thiện, chuyên luyện thi Tốt nghiệp THPT Quốc gia theo chương trình mới GDPT 2018 (định dạng 2025 - 2026).

PHONG CÁCH & VĂN PHONG:
- Tên gọi: Khoa Eng (hoặc thầy Khoa Eng).
- Thân thiện, gần gũi, chuẩn mực sư phạm, hài hước nhẹ nhàng, luôn cổ vũ tinh thần học tập của học sinh.
- Giải thích ngữ pháp dễ hiểu bằng các công thức rõ ràng, có ví dụ minh họa và dịch nghĩa tiếng Việt.
- Nắm vững các chuyên đề trọng điểm: 12 thì tiếng Anh, câu điều kiện, câu bị động, mạo từ (a/an/the), mệnh đề quan hệ, đảo ngữ, cấu trúc so sánh, từ vựng theo chủ đề SGK mới, kỹ năng đọc thông báo/tờ rơi, kỹ năng sắp xếp câu/đoạn văn.
- ĐẶC BIỆT: Khi giải thích so sánh, công thức các thì, phân biệt từ vựng dễ nhầm lẫn hoặc tóm tắt kiến thức, HÃY DÙNG BẢNG KẺ MARKDOWN (Markdown tables chuẩn với cú pháp | Tiêu đề 1 | Tiêu đề 2 |) để người học dễ quan sát và đối chiếu.
- Định dạng câu trả lời bằng Markdown sắc sảo, in đậm từ khóa quan trọng, dễ đọc, mạch lạc.
- Luôn sẵn sàng giải đáp thắc mắc về đề thi, mẹo nhớ nhanh, phân biệt các từ dễ nhầm lẫn.`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...messageHistory.slice(-8), // keep recent context
            { role: "user", content: userMessage }
        ];

        return await this.callGroq(messages, { temperature: 0.7, max_tokens: 1800 });
    }

    // Test API Connection
    async testConnection() {
        try {
            const res = await this.callGroq([
                { role: "user", content: "Ping! Hãy trả lời 'KhoaEng Ready' trong 3 từ." }
            ], { max_tokens: 30 });
            return { success: true, message: res };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    // 5. On-demand translation helper for passage and question
    async translateContent(text) {
        if (!text || !text.trim()) return "";
        const prompt = `Dịch đoạn Tiếng Anh sau sang Tiếng Việt chuẩn xác, tự nhiên, dễ hiểu dành cho học sinh THPT:\n"""${text.trim()}"""\nChỉ trả về duy nhất bản dịch Tiếng Việt, không kèm lời giải thích hay trích dẫn.`;
        try {
            return await this.callGroq([
                { role: "user", content: prompt }
            ], { max_tokens: 500, temperature: 0.3 });
        } catch (e) {
            console.warn("Translation failed, returning original:", e);
            return text;
        }
    }
}

// Fallback offline hint generator if API is momentarily unreachable
function generateOfflineHint(q) {
    return `### 🎯 Trọng tâm kiến thức
Câu hỏi này thuộc chuyên đề **${q.topic || q.category}**.

### 🔍 Dấu hiệu nhận biết & Phân tích
- Hãy quan sát kỹ chủ ngữ và trạng từ chỉ thời gian hoặc dấu hiệu liên kết trong câu.
- Xác định xem động từ đang ở thể chủ động hay bị động, số ít hay số nhiều.

### 💡 Các bước làm bài (Không tiết lộ đáp án)
1. **Bước 1**: Đọc lướt cả câu để nắm ngữ cảnh tổng quát.
2. **Bước 2**: Xác định cấu trúc ngữ pháp bắt buộc đi kèm sau các từ khóa.
3. **Bước 3**: Dùng phương pháp loại trừ - gạch bỏ 2 phương án sai cấu trúc cơ bản trước, sau đó so sánh 2 phương án còn lại dựa vào ngữ nghĩa.

> **Khoa Eng nhắc bạn**: Bình tĩnh đọc kỹ câu, tin vào cảm giác ngôn ngữ và quy tắc đã học nhé!`;
}

// Fallback diagnostic analysis
function generateOfflineAnalysis(score, correct, total, wrong, correctList) {
    const pct = Math.round((correct / total) * 100);
    return `## 📊 Đánh giá tổng quan
Bạn đã hoàn thành bài thi với kết quả **${score}/10 điểm** (Đúng **${correct}/${total}** câu - Tỷ lệ chính xác **${pct}%**).

## 🌟 Điểm mạnh đã thể hiện
- Bạn đã làm chủ tốt các câu hỏi về: ${correctList.slice(0, 3).map(c => c.topic).join(', ') || 'kiến thức nền tảng'}.
- Tinh thần luyện tập nghiêm túc và hoàn thành trọn vẹn số câu đề ra.

## ⚠️ Lỗ hổng & Điểm cần cố gắng
${wrong.length > 0 ? wrong.map(w => `- **Câu ${w.id} (${w.topic})**: Cần ôn lại chuyên đề này để tránh nhầm lẫn giữa các phương án gây nhiễu.`).join('\n') : '- Tuyệt đối không có câu sai! Phong độ xuất sắc!'}

## 🎯 Kế hoạch hành động THPT 2026
1. Tạo ngay một đề mới với chuyên đề bạn còn băn khoăn để khắc sâu phản xạ.
2. Dành 10 phút xem lại chi tiết lời giải thích từng câu bên dưới.
3. Chat trực tiếp với Khoa Eng để được giảng lại bất kỳ công thức ngữ pháp nào chưa hiểu rõ.`;
}

// Rich Curated Question Bank matching 2026 THPT format (used as offline fallback)
function getCuratedExam(count, customReq) {
    const bank = [
        {
            category: "Đọc thông báo",
            context: "ANNOUNCEMENT: SCHOOL ENVIRONMENT WEEK\nAll 12th-grade students are cordially invited to participate in the 'Green Campus' initiative. Activities will commence this Friday morning at 8:00 AM. Please ensure you bring your reusable water bottles to minimize single-use plastics.",
            question: "According to the announcement, what are students requested to bring?",
            options: [
                "A. Single-use plastic cups",
                "B. Reusable water bottles",
                "C. Gardening equipment",
                "D. Their own textbooks"
            ],
            correct: "B",
            explanation: "Trong thông báo có câu: 'Please ensure you bring your reusable water bottles to minimize single-use plastics' (Vui lòng mang theo bình nước dùng lại để giảm thiểu rác thải nhựa).",
            topic: "Đọc điền thông báo thực tế"
        },
        {
            category: "Sắp xếp câu",
            context: "",
            question: "Mark the letter A, B, C, or D to indicate the correct arrangement of the sentences to make a meaningful letter:\na. Dear Sir/Madam, I am writing to inquire about the upcoming IELTS preparation course.\nb. I look forward to hearing from you at your earliest convenience.\nc. Specifically, could you please provide details regarding the schedule and tuition fees?\nd. Thank you very much for your time and assistance.",
            options: [
                "A. a - c - d - b",
                "B. c - a - b - d",
                "C. a - d - c - b",
                "D. d - a - c - b"
            ],
            correct: "A",
            explanation: "Thứ tự một bức thư yêu cầu thông tin chuẩn: a (Mở đầu nêu mục đích viết thư) -> c (Chi tiết câu hỏi cụ thể) -> d (Cảm ơn) -> b (Lời kết mong sớm nhận hồi âm).",
            topic: "Sắp xếp thư tín logic"
        },
        {
            category: "Ngữ pháp",
            context: "The historic temple ________ by thousands of international tourists every year since its restoration was completed.",
            question: "The historic temple ________ by thousands of international tourists every year since its restoration was completed.",
            options: [
                "A. has been visited",
                "B. is visiting",
                "C. was visited",
                "D. had visited"
            ],
            correct: "A",
            explanation: "Chủ ngữ 'The historic temple' là vật bị tác động, đi cùng mệnh đề 'since its restoration was completed' nên động từ chính phải chia ở thì Hiện tại hoàn thành thể bị động (has been + V3/ed).",
            topic: "Câu bị động & Thì Hiện tại hoàn thành"
        },
        {
            category: "Từ vựng",
            context: "With the rapid advancement of Artificial Intelligence, students need to develop ________ thinking to evaluate information critically.",
            question: "With the rapid advancement of Artificial Intelligence, students need to develop ________ thinking to evaluate information critically.",
            options: [
                "A. critical",
                "B. criticize",
                "C. critically",
                "D. criticism"
            ],
            correct: "A",
            explanation: "Cụm danh từ 'critical thinking' nghĩa là 'tư duy phản biện'. Vị trí đứng trước danh từ 'thinking' cần một tính từ (critical).",
            topic: "Từ loại & Collocations"
        },
        {
            category: "Đọc thông báo",
            context: "COMMUNITY WORKSHOP NOTICE\nTitle: Digital Skills for High Schoolers\nTime: Sunday, 2:00 PM - 5:00 PM\nSpeaker: Dr. Minh Khoa (Tech Lead)\nRegistration is free ________ all registered students who sign up before midnight Thursday.",
            question: "Registration is free ________ all registered students who sign up before midnight Thursday.",
            options: [
                "A. for",
                "B. with",
                "C. at",
                "D. into"
            ],
            correct: "A",
            explanation: "Cấu trúc giới từ: 'free for somebody' (miễn phí đối với ai đó).",
            topic: "Giới từ & Cấu trúc thông báo"
        },
        {
            category: "Ngữ pháp",
            context: "If modern farmers ________ more eco-friendly cultivation techniques years ago, the regional soil would not be severely degraded today.",
            question: "If modern farmers ________ more eco-friendly cultivation techniques years ago, the regional soil would not be severely degraded today.",
            options: [
                "A. had adopted",
                "B. adopted",
                "C. have adopted",
                "D. adopt"
            ],
            correct: "A",
            explanation: "Câu điều kiện hỗn hợp (Mixed conditional): Mệnh đề If nói về giả định trái ngược với quá khứ ('years ago' -> Past Perfect: had adopted), mệnh đề chính nói về kết quả ở hiện tại ('today' -> would not be degraded).",
            topic: "Câu điều kiện hỗn hợp (Mixed Conditionals)"
        },
        {
            category: "Sắp xếp câu",
            context: "",
            question: "Mark the letter A, B, C, or D to indicate the correct order of sentences to form a coherent paragraph:\na. Moreover, regular exercise significantly boosts memory retention and cognitive focus.\nb. Engaging in daily physical activity yields numerous academic benefits for high schoolers.\nc. In conclusion, balancing physical fitness with study routines is essential for all students.\nd. For instance, a brisk 20-minute walk can immediately relieve study-induced stress.",
            options: [
                "A. b - d - a - c",
                "B. a - b - d - c",
                "C. b - a - c - d",
                "D. d - b - a - c"
            ],
            correct: "A",
            explanation: "b (Câu chủ đề: lợi ích của thể dục) -> d (Ví dụ cụ thể thứ nhất) -> a (Liên từ bổ sung 'Moreover' thêm lợi ích thứ hai) -> c (Kết luận 'In conclusion').",
            topic: "Sắp xếp đoạn văn logic"
        },
        {
            category: "Ngữ pháp",
            context: "It was ________ European university where she successfully earned her master's degree in sustainable development.",
            question: "It was ________ European university where she successfully earned her master's degree in sustainable development.",
            options: [
                "A. a",
                "B. an",
                "C. the",
                "D. zero article (không dùng)"
            ],
            correct: "A",
            explanation: "Từ 'European' bắt đầu bằng nguyên âm 'E' nhưng phiên âm là phụ âm /jʊərəˈpiːən/ (bắt đầu bằng âm /j/), nên ta dùng mạo từ 'a' chứ không dùng 'an'.",
            topic: "Mạo từ a/an/the đặc biệt"
        },
        {
            category: "Từ vựng",
            context: "Many university graduates are striving to ________ up with the latest technological developments in automation and cloud computing.",
            question: "Many university graduates are striving to ________ up with the latest technological developments in automation and cloud computing.",
            options: [
                "A. keep",
                "B. put",
                "C. catch",
                "D. hold"
            ],
            correct: "A",
            explanation: "Cụm phrasal verb: 'keep up with' mang nghĩa theo kịp, bắt kịp với xu hướng/tiến bộ công nghệ.",
            topic: "Phrasal verbs thông dụng"
        },
        {
            category: "Đọc hiểu",
            context: "PASSAGE:\nRenewable energy sources such as solar and wind power are increasingly seen as the bedrock of future economies. Unlike fossil fuels, they generate minimal greenhouse gases and offer sustainable energy independence. However, the initial infrastructure installation costs remain a hurdle for many developing nations.",
            question: "According to the passage, what is the primary challenge of renewable energy for developing nations?",
            options: [
                "A. High greenhouse gas emissions",
                "B. Initial infrastructure installation expenses",
                "C. Lack of sunlight and wind",
                "D. Inability to provide long-term energy"
            ],
            correct: "B",
            explanation: "Đoạn văn nêu rõ: 'However, the initial infrastructure installation costs remain a hurdle for many developing nations.' (Tuy nhiên, chi phí lắp đặt cơ sở hạ tầng ban đầu vẫn là một rào cản).",
            topic: "Đọc hiểu tìm chi tiết"
        },
        {
            category: "Ngữ pháp",
            context: "Hardly ________ the virtual examination room when the technical connectivity issue occurred.",
            question: "Hardly ________ the virtual examination room when the technical connectivity issue occurred.",
            options: [
                "A. had the candidate entered",
                "B. the candidate entered",
                "C. did the candidate enter",
                "D. has the candidate entered"
            ],
            correct: "A",
            explanation: "Cấu trúc đảo ngữ với 'Hardly': Hardly + had + S + V3/ed + when + S + V2/ed (Vừa mới... thì...).",
            topic: "Đảo ngữ nâng cao"
        },
        {
            category: "Ngữ pháp",
            context: "The young scientist ________ research on microplastics won the prestigious national innovation award.",
            question: "The young scientist ________ research on microplastics won the prestigious national innovation award.",
            options: [
                "A. whose",
                "B. whom",
                "C. which",
                "D. that"
            ],
            correct: "A",
            explanation: "Đại từ quan hệ chỉ sở hữu 'whose' đứng giữa hai danh từ ('scientist' và 'research') để chỉ công trình nghiên cứu của nhà khoa học trẻ.",
            topic: "Mệnh đề quan hệ sở hữu"
        },
        {
            category: "Từ vựng",
            context: "The school principal congratulated the debate team on their ________ performance in the national championship.",
            question: "The school principal congratulated the debate team on their ________ performance in the national championship.",
            options: [
                "A. outstanding",
                "B. outstand",
                "C. outstandingly",
                "D. outstayed"
            ],
            correct: "A",
            explanation: "Đứng trước danh từ 'performance' cần tính từ 'outstanding' (xuất sắc, nổi bật) để bổ nghĩa.",
            topic: "Từ loại tính từ"
        },
        {
            category: "Sắp xếp câu",
            context: "",
            question: "Rearrange the dialogue between Nam and Lan into a logical conversation:\na. Nam: 'Have you registered for the online mock exam on KhoaEng yet?'\nb. Lan: 'Not yet! Is it modeled after the new 2026 format?'\nc. Nam: 'Yes, exactly! It includes reading announcements and sentence ordering.'\nd. Lan: 'Awesome! Let's sign up right now.'",
            options: [
                "A. a - b - c - d",
                "B. b - a - c - d",
                "C. a - c - b - d",
                "D. c - a - b - d"
            ],
            correct: "A",
            explanation: "Nam hỏi trước (a) -> Lan đáp lại và hỏi thêm (b) -> Nam xác nhận (c) -> Lan hào hứng đồng ý đăng ký (d).",
            topic: "Sắp xếp hội thoại giao tiếp"
        },
        {
            category: "Ngữ pháp",
            context: "The report ________ by the environmental council suggests reducing single-use packaging across all convenience stores.",
            question: "The report ________ by the environmental council suggests reducing single-use packaging across all convenience stores.",
            options: [
                "A. prepared",
                "B. preparing",
                "C. was prepared",
                "D. is preparing"
            ],
            correct: "A",
            explanation: "Rút gọn mệnh đề quan hệ dạng bị động (The report which was prepared -> The report prepared). Động từ chính của câu là 'suggests'.",
            topic: "Rút gọn mệnh đề quan hệ bị động"
        },
        {
            category: "Đọc hiểu",
            context: "PASSAGE:\nEffective time management is a cornerstone of academic triumph. Students who craft realistic weekly revision schedules experience significantly lower levels of test anxiety compared to those who cram right before exams.",
            question: "The word 'triumph' in the passage is closest in meaning to ________.",
            options: [
                "A. success",
                "B. pressure",
                "C. failure",
                "D. contest"
            ],
            correct: "A",
            explanation: "Từ 'triumph' nghĩa là thắng lợi, thành công rực rỡ, đồng nghĩa với 'success'.",
            topic: "Đọc hiểu từ đồng nghĩa ngữ cảnh"
        },
        {
            category: "Ngữ pháp",
            context: "By the time the graduation ceremony takes place next month, all senior students ________ their final project dissertations.",
            question: "By the time the graduation ceremony takes place next month, all senior students ________ their final project dissertations.",
            options: [
                "A. will have completed",
                "B. completed",
                "C. will complete",
                "D. have completed"
            ],
            correct: "A",
            explanation: "Cấu trúc với 'By the time + hiện tại đơn' diễn tả hành động sẽ hoàn tất trước một thời điểm trong tương lai -> Dùng thì Tương lai hoàn thành (will have + V3/ed).",
            topic: "Thì Tương lai hoàn thành"
        },
        {
            category: "Từ vựng",
            context: "She decided to ________ for the volunteer teaching program in mountainous remote areas.",
            question: "She decided to ________ for the volunteer teaching program in mountainous remote areas.",
            options: [
                "A. apply",
                "B. ask",
                "C. supply",
                "D. demand"
            ],
            correct: "A",
            explanation: "Cấu trúc 'apply for something' nghĩa là nộp đơn ứng tuyển / tham gia một chương trình.",
            topic: "Cụm động từ cố định"
        },
        {
            category: "Ngữ pháp",
            context: "No sooner ________ their high school graduation than they started receiving university scholarship offers.",
            question: "No sooner ________ their high school graduation than they started receiving university scholarship offers.",
            options: [
                "A. had they celebrated",
                "B. did they celebrate",
                "C. have they celebrated",
                "D. they had celebrated"
            ],
            correct: "A",
            explanation: "Cấu trúc đảo ngữ: No sooner + had + S + V3/ed + than + S + V2/ed.",
            topic: "Đảo ngữ No sooner... than"
        },
        {
            category: "Đọc thông báo",
            context: "NOTICE: CAMPUS LIBRARY RENOVATION\nPlease be advised that the second-floor quiet study area will remain closed for maintenance until next Tuesday. Students are encouraged to utilize the digital commons on the ground floor.",
            question: "Where can students study while the second floor is under maintenance?",
            options: [
                "A. On the ground floor digital commons",
                "B. In the outdoor cafeteria",
                "C. Only at home",
                "D. On the roof terrace"
            ],
            correct: "A",
            explanation: "Thông báo ghi rõ: 'Students are encouraged to utilize the digital commons on the ground floor.'",
            topic: "Đọc thông báo trường học"
        }
    ];

    // Pick requested count, shuffling slightly to feel fresh
    const shuffled = [...bank].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count).map((item, idx) => ({
        ...item,
        id: idx + 1
    }));

    return {
        examTitle: `Đề Luyện Thi THPT 2026 - KhoaEng #${Math.floor(Math.random() * 900 + 100)}`,
        totalQuestions: selected.length,
        questions: selected
    };
}

window.khoaAI = new KhoaEngAI();
window.generateOfflineHint = generateOfflineHint;
window.generateOfflineAnalysis = generateOfflineAnalysis;
