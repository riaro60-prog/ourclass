
import { GoogleGenAI } from "@google/genai";

// 브라우저 환경에서 process가 없을 경우를 대비한 안전한 API KEY 획득
const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const getAIClassSuggestions = async (context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `초등학교 학급 운영에 대한 아이디어를 제안해줘. 주제: ${context}. 답변은 한국어로, 초등학교 선생님이 아이들을 위해 읽어주거나 참고하기 좋은 따뜻하고 재미있는 말투로 작성해줘.`,
      config: {
        temperature: 0.8,
        topP: 0.95,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "죄송해요, 아이디어를 가져오는 중에 문제가 발생했어요. 잠시 후 다시 시도해주세요!";
  }
};

export const getEncouragementMessage = async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "초등학교 선생님이 학생들에게 아침 조회 시간에 전할만한 짧고 따뜻한 응원의 메시지 한 문장을 만들어줘.",
      config: {
        temperature: 1.0,
      }
    });
    return response.text;
  } catch (error) {
    return "오늘 하루도 우리 함께 즐겁게 보내보자!";
  }
};
