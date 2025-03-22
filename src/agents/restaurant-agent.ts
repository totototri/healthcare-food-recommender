// src/agents/restaurant-agent.ts - レストラン検索用カスタムエージェント

import axios from 'axios';
import { config } from '../config';

// 健康条件からキーワードを抽出する関数
function extractKeywords(healthConditions: string): string[] {
  const keywords: string[] = [];
  
  // 低糖質ダイエットのキーワード
  if (/糖尿|血糖|低糖|糖質制限/i.test(healthConditions)) {
    keywords.push('低糖質', 'ロカボ', 'ダイエット');
  }
  
  // 減塩ダイエットのキーワード
  if (/高血圧|塩分|減塩|ナトリウム/i.test(healthConditions)) {
    keywords.push('減塩', 'ヘルシー');
  }
  
  // カロリー制限のキーワード
  if (/カロリー|体重|ダイエット|肥満/i.test(healthConditions)) {
    keywords.push('ダイエット', 'ヘルシー', 'カロリー控えめ');
  }
  
  // その他の一般的な健康食のキーワード
  keywords.push('オーガニック', '健康', 'ベジタリアン');
  
  return [...new Set(keywords)]; // 重複を削除
}

// レストラン情報インターフェース
export interface Restaurant {
  name: string;
  address: string;
  cuisine?: string;
  healthOptions?: string;
  rating?: number;
  photoUrl?: string;
  priceLevel?: number;
  url?: string;
}

// Google Places APIを使用してレストランを検索する関数
export async function searchRestaurants(
  location: string,
  healthConditions: string,
  radius: number = 1500,
  limit: number = 5
): Promise<Restaurant[]> {
  try {
    // APIキーがない場合はモックデータを返す
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.warn('Google Places API key is not set, using mock data');
      return getMockRestaurants();
    }
    
    // 健康条件からキーワードを抽出
    const keywords = extractKeywords(healthConditions);
    const keywordString = keywords.join(' ');
    
    // 位置情報を取得 (地名/住所から緯度経度に変換)
    const geocodeResponse = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address: location,
          key: process.env.GOOGLE_PLACES_API_KEY
        }
      }
    );
    
    if (geocodeResponse.data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${geocodeResponse.data.status}`);
    }
    
    const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
    const locationString = `${lat},${lng}`;
    
    // レストランを検索
    const placesResponse = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: locationString,
          radius,
          type: 'restaurant',
          keyword: keywordString,
          key: process.env.GOOGLE_PLACES_API_KEY
        }
      }
    );
    
    if (placesResponse.data.status !== 'OK') {
      if (placesResponse.data.status === 'ZERO_RESULTS') {
        return []; // 検索結果が0件の場合は空配列を返す
      }
      throw new Error(`Place search failed: ${placesResponse.data.status}`);
    }
    
    // レスポンスをRestaurant形式に変換
    const restaurants: Restaurant[] = placesResponse.data.results
      .slice(0, limit)
      .map((place: any) => ({
        name: place.name,
        address: place.vicinity,
        rating: place.rating,
        priceLevel: place.price_level,
        photoUrl: place.photos && place.photos[0]
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
          : undefined,
        // 健康オプションは実際のAPIからは取得できないため、キーワードに基づいて推測
        healthOptions: suggestHealthOptions(place.name, place.types, keywords)
      }));
    
    return restaurants;
    
  } catch (error) {
    console.error('Error in restaurant search:', error);
    // エラー時はモックデータを返す
    return getMockRestaurants();
  }
}

// レストラン名と種類から健康オプションを推測する関数
function suggestHealthOptions(name: string, types: string[], keywords: string[]): string {
  const options: string[] = [];
  
  // レストラン名から推測
  const lowerName = name.toLowerCase();
  if (/organ|オーガニック/.test(lowerName)) options.push('オーガニック食材使用');
  if (/veg|ベジ|ヴェジ/.test(lowerName)) options.push('ベジタリアンメニューあり');
  if (/health|ヘルシー|健康/.test(lowerName)) options.push('健康志向メニュー');
  if (/diet|ダイエット/.test(lowerName)) options.push('ダイエット向けメニュー');
  
  // レストランタイプから推測
  if (types.includes('vegetarian_restaurant')) options.push('ベジタリアン専門');
  if (types.includes('health')) options.push('健康食専門');
  
  // 検索キーワードに基づいて推測
  if (keywords.includes('低糖質')) options.push('低糖質メニューあり');
  if (keywords.includes('減塩')) options.push('減塩メニューあり');
  
  return options.length > 0 ? options.join('、') : '健康的なメニューあり';
}

// モックレストランデータを返す関数
function getMockRestaurants(): Restaurant[] {
  return [
    {
      name: "ヘルシーガーデン",
      address: "東京都渋谷区神宮前5-1-1",
      cuisine: "オーガニック、ベジタリアン",
      healthOptions: "低糖質、グルテンフリーメニュー有り",
      rating: 4.5
    },
    {
      name: "メディカルキッチン",
      address: "東京都新宿区西新宿1-1-1",
      cuisine: "地中海料理、和食",
      healthOptions: "減塩メニュー、カロリー表示あり",
      rating: 4.2
    },
    {
      name: "ナチュラルテーブル",
      address: "東京都千代田区丸の内1-1-1",
      cuisine: "イタリアン、健康食",
      healthOptions: "アレルギー対応、栄養バランス重視",
      rating: 4.0
    }
  ];
}
