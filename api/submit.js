export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const data = req.body;

        // Validate required fields
        if (!data.studentName || !data.studentSurname) {
            return res.status(400).json({
                success: false,
                error: 'Student name and surname are required'
            });
        }

        // Get Telegram credentials from environment variables
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.error('Missing Telegram environment variables');
            return res.status(500).json({
                success: false,
                error: 'Server configuration error'
            });
        }

        // Format the message for Telegram
        const submissionType = data.isAutoSubmit ? '⏰ AUTO-SUBMIT (Time Up)' : '✅ MANUAL SUBMIT';
        const words1 = data.task1Answer ? data.task1Answer.split(/\s+/).length : 0;
        const words2 = data.task2Answer ? data.task2Answer.split(/\s+/).length : 0;
        const totalWords = words1 + words2;

        const message = `
🎓 *IELTS Writing Pro - New Submission*
${submissionType}

*Student Information:*
• 👤 ${data.studentName} ${data.studentSurname}
• 📝 ${data.setName}
• ⏱️ Time Spent: ${data.timerValue}
• 🕒 Submitted: ${new Date(data.submittedAt).toLocaleString()}

━━━━━━━━━━━━━━━━━━━━

*📊 Task 1 Question:*
${data.task1Question}

*📝 Task 1 Answer:*
${data.task1Answer || 'No answer provided'}
*📈 Words:* ${words1}

━━━━━━━━━━━━━━━━━━━━

*📊 Task 2 Question:*
${data.task2Question}

*📝 Task 2 Answer:*
${data.task2Answer || 'No answer provided'}
*📈 Words:* ${words2}

━━━━━━━━━━━━━━━━━━━━

*📊 Summary:*
• Total Words: ${totalWords}
• Task 1 Status: ${words1 >= 150 ? '✅ Met requirement' : '⚠️ Below 150 words'}
• Task 2 Status: ${words2 >= 250 ? '✅ Met requirement' : '⚠️ Below 250 words'}

${data.isAutoSubmit ? '\\n⏰ *Note: This test was automatically submitted when time ended.*' : ''}
        `.trim();

        // Send message to Telegram using Bot API
        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        const telegramResponse = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            })
        });

        const telegramResult = await telegramResponse.json();

        if (!telegramResult.ok) {
            console.error('Telegram API error:', telegramResult);
            throw new Error(`Telegram API error: ${telegramResult.description}`);
        }

        // Return success response to client
        return res.status(200).json({
            success: true,
            message: 'Test submitted successfully',
            telegramMessageId: telegramResult.result.message_id,
            wordCounts: {
                task1: words1,
                task2: words2,
                total: totalWords
            }
        });

    } catch (error) {
        console.error('Submission processing error:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}
