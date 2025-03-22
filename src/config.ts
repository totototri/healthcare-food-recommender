// src/config.ts
export const config = {
  // GraphAI設定
  graphai: {
    version: "0.5"
  },
  
  // OpenAI設定
  openai: {
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY
  },
  
  // レストランAPI設定
  restaurantApi: {
    provider: "google-places",
    apiKey: process.env.GOOGLE_PLACES_API_KEY,
    searchRadius: 1500  // メートル単位
  },
  
  // プライバシー設定
  privacy: {
    anonymizationLevel: "high",  // high, medium, low
    localProcessingOnly: true    // 機密データはローカルのみで処理
  }
};
