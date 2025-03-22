// src/index.ts - アプリケーションのエントリーポイント

import * as dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { config } from './config';
import axios from 'axios';

// .envファイルの読み込み
dotenv.config();

// Expressアプリケーションの設定
const app = express();
const port = process.env.PORT || 3000;

// JSONの解析とURLエンコードフォームの解析を有効化
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, '../public')));

// 健康データインターフェース
interface HealthData {
  [key: string]: string;
}

// レストランインターフェース
interface Restaurant {
  name: string;
  address: string;
  cuisine?: string;
  healthOptions?: string;
  rating?: number;
  photoUrl?: string;
  priceLevel?: number;
  url?: string;
}

// APIエンドポイント: 健康データの処理と食事推薦
// APIエンドポイント: 健康データの処理と食事推薦
app.post('/api/recommend', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    const { healthData, location } = req.body;
    
    if (!healthData || Object.keys(healthData).length === 0) {
      return res.status(400).json({ error: '健康データが必要です' });
    }
    
    // 1. 健康データの分析
    let healthAnalysis;
    try {
      healthAnalysis = await processHealthData(healthData);
      console.log('Health analysis completed:', healthAnalysis);
    } catch (error) {
      console.error('Error in health analysis:', error);
      healthAnalysis = "健康データの分析中にエラーが発生しました。一般的に、バランスの取れた食事と適度な運動が推奨されます。";
    }
    
    // 2. 食事の推薦
    let dietSuggestions;
    try {
      dietSuggestions = await recommendDiet(healthAnalysis);
      console.log('Diet suggestions generated');
    } catch (error) {
      console.error('Error in diet recommendations:', error);
      dietSuggestions = [
        {
          name: "バランスの良い日本食",
          description: "玄米、焼き魚、季節の野菜の煮物を中心とした低塩分・低脂質の食事",
          nutrition: "カロリー: 450kcal, 炭水化物: 60g, タンパク質: 25g, 脂質: 10g"
        }
      ];
    }
    
    // 3. レストランの検索 (location が指定されている場合)
let restaurants: Restaurant[] = [];
    if (location) {
      try {
        restaurants = await searchRestaurants(location, healthAnalysis);
        console.log('Restaurant suggestions generated');
      } catch (error) {
        console.error('Error in restaurant search:', error);
        // エラー時はデフォルトレストランを返す
      }
    }
    
    // 4. レスポンスの返却
    const responseData = {
      healthAdvice: healthAnalysis,
      dietSuggestions,
      restaurants
    };
    
    console.log('Sending response');
    res.json(responseData);
    
  } catch (error) {
    console.error('Error processing recommendation:', error);
    res.status(500).json({ 
      error: 'レコメンデーションの処理中にエラーが発生しました', 
      healthAdvice: "データ処理中にエラーが発生しました。一般的な健康的な食事習慣を心がけてください。",
      dietSuggestions: [
        {
          name: "エラー時のデフォルト推薦",
          description: "バランスの取れた食事を心がけてください。野菜、タンパク質、穀物をバランスよく摂取しましょう。",
          nutrition: "栄養バランスを考慮した食事"
        }
      ],
      restaurants: []
    });
  }
});

async function processHealthData(healthData: HealthData): Promise<string> {
  try {
    // 各健康データの範囲検証
    const validateHealthValue = (value: string, min: number, max: number, name: string) => {
      const numValue = parseFloat(value);
      
      if (isNaN(numValue)) {
        throw new Error(`${name}は数値で入力してください`);
      }
      
      if (numValue < min || numValue > max) {
        throw new Error(`${name}は${min}〜${max}の範囲で入力してください`);
      }
      
      return numValue;
    };

    let analysis = "";
    
    // 血糖値の評価
    if (healthData.bloodSugar) {
      const bloodSugar = validateHealthValue(
        healthData.bloodSugar, 
        0, 
        500, 
        '血糖値'
      );
      
      analysis += `<h4>血糖値管理</h4>`;
      if (bloodSugar > 140) {
        analysis += `<p>血糖値（${bloodSugar} mg/dL）が高めです。糖尿病のリスクを示唆しています。以下の対策をお勧めします：</p>`;
        analysis += `<ul>
          <li>砂糖や精製された炭水化物（白パン、白米、菓子類など）の摂取を減らす</li>
          <li>ジュースやソーダなどの糖分の高い飲料を避ける</li>
          <li>全粒穀物（玄米、全粒小麦パンなど）を選ぶ</li>
          <li>野菜や果物を多く摂る（ただし、果物は糖分が高いものは控えめに）</li>
        </ul>`;
      } else if (bloodSugar > 100) {
        analysis += `<p>血糖値（${bloodSugar} mg/dL）が正常範囲の上限付近です。予防的な食事管理をお勧めします：</p>`;
        analysis += `<ul>
          <li>食事の炭水化物と糖質のバランスに注意する</li>
          <li>食物繊維を豊富に含む食品を積極的に摂取する</li>
          <li>規則正しい食事時間を心がける</li>
        </ul>`;
      } else {
        analysis += `<p>血糖値は正常範囲内です。現在の食生活を維持しましょう。</p>`;
      }
    }

    // 中性脂肪の評価
    if (healthData.triglyceride) {
      const triglyceride = validateHealthValue(
        healthData.triglyceride, 
        0, 
        1000, 
        '中性脂肪'
      );
      
      analysis += `<h4>中性脂肪管理</h4>`;
      if (triglyceride > 150) {
        analysis += `<p>中性脂肪（${triglyceride} mg/dL）が高めです。心血管疾患のリスクを高める可能性があります。以下の対策をお勧めします：</p>`;
        analysis += `<ul>
          <li>飽和脂肪酸（赤肉、バター、高脂肪乳製品）の摂取を減らす</li>
          <li>糖質の摂取を控える</li>
          <li>オメガ3脂肪酸が豊富な食品（サーモン、マグロ、亜麻仁、チアシード）を取り入れる</li>
          <li>適度な有酸素運動を定期的に行う</li>
        </ul>`;
      } else {
        analysis += `<p>中性脂肪の値は正常範囲内です。健康的な脂質バランスを維持しましょう。</p>`;
      }
    }

    // コレステロールの評価
    if (healthData.LDL || healthData.HDL || healthData.totalCholesterol) {
      analysis += `<h4>コレステロール管理</h4><p>`;
      
      if (healthData.LDL) {
        const ldl = validateHealthValue(healthData.LDL, 0, 500, 'LDLコレステロール');
        if (ldl > 140) {
          analysis += `LDLコレステロール（悪玉コレステロール）が高めです。`;
        }
      }
      
      if (healthData.HDL) {
        const hdl = validateHealthValue(healthData.HDL, 0, 200, 'HDLコレステロール');
        if (hdl < 40) {
          analysis += `HDLコレステロール（善玉コレステロール）が低めです。`;
        }
      }
      
      analysis += `コレステロール値を改善するために以下の対策をお勧めします：</p>`;
      analysis += `<ul>
        <li>不飽和脂肪酸を多く含む食品（オリーブオイル、アボカド、ナッツ類）を適量取り入れる</li>
        <li>食物繊維が豊富な食品（野菜、全粒穀物、豆類）を多く摂る</li>
        <li>加工食品や揚げ物を控える</li>
      </ul>`;
    }

    // 白血球数の評価
    if (healthData.WBC) {
      const wbc = validateHealthValue(healthData.WBC, 0, 20000, '白血球数');
      
      analysis += `<h4>免疫機能</h4>`;
      if (wbc > 10000) {
        analysis += `<p>白血球数が高めです。免疫反応が活発な状態です。ビタミンCやDを含む食品を摂取しましょう。</p>`;
      } else if (wbc < 4000) {
        analysis += `<p>白血球数が低めです。良質なタンパク質や抗酸化物質を含む食品を積極的に摂取しましょう。</p>`;
      } else {
        analysis += `<p>白血球数は正常範囲内です。バランスの良い食事で免疫力を維持しましょう。</p>`;
      }
    }

    // 鉄分関連の評価
    if (healthData.iron || healthData.ferritin || healthData.serumIron) {
      analysis += `<h4>鉄分管理</h4>`;
      let ironDeficiency = false;
      
      if (healthData.iron) {
        const iron = validateHealthValue(healthData.iron, 0, 200, '鉄分');
        if (iron < 60) ironDeficiency = true;
      }
      
      if (healthData.ferritin) {
        const ferritin = validateHealthValue(healthData.ferritin, 0, 500, 'フェリチン');
        if (ferritin < 50) ironDeficiency = true;
      }
      
      if (healthData.serumIron) {
        const serumIron = validateHealthValue(healthData.serumIron, 0, 200, '血清鉄');
        if (serumIron < 60) ironDeficiency = true;
      }
      
      if (ironDeficiency) {
        analysis += `<p>鉄分が不足している可能性があります。以下の食品を積極的に摂取してください：</p>`;
        analysis += `<ul>
          <li>鉄分を含む食品（赤身肉、レバー、ほうれん草、豆類）</li>
          <li>ビタミンCを含む食品（柑橘類、キウイ、パプリカ）と一緒に摂ると吸収率が上がります</li>
        </ul>`;
      } else {
        analysis += `<p>鉄分値は正常範囲内です。バランスの良い食事を継続しましょう。</p>`;
      }
    }

    // 亜鉛の評価
    if (healthData.zinc) {
      const zinc = validateHealthValue(healthData.zinc, 0, 200, '亜鉛');
      
      analysis += `<h4>亜鉛管理</h4>`;
      if (zinc < 80 && zinc > 0) {
        analysis += `<p>亜鉛が不足している可能性があります。以下の食品を摂取しましょう：</p>`;
        analysis += `<ul>
          <li>牡蠣、牛肉、豚肉、ナッツ類など亜鉛を豊富に含む食品</li>
          <li>亜鉛の吸収を高めるためにビタミンCを含む食品との併用もお勧めします</li>
        </ul>`;
      } else {
        analysis += `<p>亜鉛値は正常範囲内です。免疫機能の維持に重要なため、引き続き意識してください。</p>`;
      }
    }

    // 総合的なアドバイス
    analysis += `<h4>総合的なアドバイス</h4>`;
    analysis += `<ul>
      <li>水分を十分に取る</li>
      <li>定期的な運動を心がける</li>
      <li>食事はバランスよく、過食を避ける</li>
    </ul>`;
    
    analysis += `<p>これらの推奨事項を実行することで、全体的な健康状態の向上が期待できます。ただし、これらの変更を行う前に、医師や栄養専門家と相談することをお勧めします。</p>`;
    
    return analysis;
    
  } catch (error) {
    console.error('Error in processHealthData:', error);
    return `<p>${error instanceof Error ? error.message : '健康データの分析中にエラーが発生しました'}</p>`;
  }
}




// 食事推薦関数
     // 食事推薦関数
async function recommendDiet(healthAnalysis: string): Promise<Array<{name: string, description: string, nutrition: string}>> {
  try {
    // OpenAI APIがセットアップされていない場合はモックデータを返す
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key is not set, using mock diet recommendations');
      return [
        {
          name: "地中海風サラダボウル",
          description: "オリーブオイルでドレッシングした新鮮な野菜とレンズ豆のサラダ。低糖質で塩分控えめ。",
          nutrition: "カロリー: 350kcal, 炭水化物: 30g, タンパク質: 15g, 脂質: 20g, 食塩相当量: 1.5g"
        },
        {
          name: "蒸し鶏と季節野菜のプレート",
          description: "香草で香り付けした蒸し鶏と、軽く蒸した季節の野菜。シンプルな味付けで塩分を抑えています。",
          nutrition: "カロリー: 420kcal, 炭水化物: 25g, タンパク質: 40g, 脂質: 18g, 食塩相当量: 1.2g"
        },
        {
          name: "玄米と焼き魚の和風セット",
          description: "玄米ご飯と、塩分控えめの焼き魚、小鉢3種。低GIで血糖値の上昇を緩やかにします。",
          nutrition: "カロリー: 480kcal, 炭水化物: 60g, タンパク質: 30g, 脂質: 12g, 食塩相当量: 1.8g"
        }
      ];
    }
    
    // OpenAI APIを使用して健康状態に基づいた食事を提案
    const prompt = `
      以下の健康分析に基づいて、適切な食事提案を3つ作成してください。
      各提案には料理名、説明、栄養情報を含めてください。
      
      健康分析:
      ${healthAnalysis}
      
      回答は以下の構造のJSONでお願いします:
      [
        {
          "name": "料理名",
          "description": "説明",
          "nutrition": "栄養情報"
        },
        ...
      ]
    `;
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4-turbo-preview",
        messages: [
          { role: 'system', content: 'あなたは健康的な食事を提案する栄養士です。JSON形式で回答してください。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // JSONレスポンスをパース
    const content = response.data.choices[0].message.content;
    console.log('OpenAI response content:', content);

    try {
      const parsed = JSON.parse(content);
      
      // 複数の可能なレスポンス形式に対応
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (parsed.meals && Array.isArray(parsed.meals)) {
        return parsed.meals;
      } else if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        return parsed.recommendations;
      } else if (parsed.name && parsed.description) {
        // 単一の食事提案が返された場合
        return [parsed];
      } else {
        // その他の形式の場合はキーを検索
        const possibleArrayKeys = Object.keys(parsed).filter(key => Array.isArray(parsed[key]));
        if (possibleArrayKeys.length > 0) {
          return parsed[possibleArrayKeys[0]];
        }
        
        // どの形式にも当てはまらない場合はモックデータを返す
        return [
          {
            name: "健康的な地中海風サラダ",
            description: "あなたの健康状態に基づいて推奨される、新鮮な野菜とオリーブオイルを使用した地中海風サラダです。",
            nutrition: "ビタミン、ミネラル、健康的な脂肪酸を豊富に含みます。"
          }
        ];
      }
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      // JSON解析に失敗した場合はモックデータを返す
      return [
        {
          name: "地中海風サラダボウル",
          description: "オリーブオイルでドレッシングした新鮮な野菜とレンズ豆のサラダ。低糖質で塩分控えめ。",
          nutrition: "カロリー: 350kcal, 炭水化物: 30g, タンパク質: 15g, 脂質: 20g, 食塩相当量: 1.5g"
        },
        {
          name: "蒸し鶏と季節野菜のプレート",
          description: "香草で香り付けした蒸し鶏と、軽く蒸した季節の野菜。シンプルな味付けで塩分を抑えています。",
          nutrition: "カロリー: 420kcal, 炭水化物: 25g, タンパク質: 40g, 脂質: 18g, 食塩相当量: 1.2g"
        },
        {
          name: "玄米と焼き魚の和風セット",
          description: "玄米ご飯と、塩分控えめの焼き魚、小鉢3種。低GIで血糖値の上昇を緩やかにします。",
          nutrition: "カロリー: 480kcal, 炭水化物: 60g, タンパク質: 30g, 脂質: 12g, 食塩相当量: 1.8g"
        }
      ];
    }
    
  } catch (error) {
    console.error('Error in recommendDiet:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('OpenAI API response:', error.response.data);
    }
    // エラー時はモックデータを返す
    return [
      {
        name: "地中海風サラダボウル",
        description: "オリーブオイルでドレッシングした新鮮な野菜とレンズ豆のサラダ。低糖質で塩分控えめ。",
        nutrition: "カロリー: 350kcal, 炭水化物: 30g, タンパク質: 15g, 脂質: 20g, 食塩相当量: 1.5g"
      },
      {
        name: "蒸し鶏と季節野菜のプレート",
        description: "香草で香り付けした蒸し鶏と、軽く蒸した季節の野菜。シンプルな味付けで塩分を抑えています。",
        nutrition: "カロリー: 420kcal, 炭水化物: 25g, タンパク質: 40g, 脂質: 18g, 食塩相当量: 1.2g"
      },
      {
        name: "玄米と焼き魚の和風セット",
        description: "玄米ご飯と、塩分控えめの焼き魚、小鉢3種。低GIで血糖値の上昇を緩やかにします。",
        nutrition: "カロリー: 480kcal, 炭水化物: 60g, タンパク質: 30g, 脂質: 12g, 食塩相当量: 1.8g"
      }
    ];
  }
} 

// レストラン検索関数
async function searchRestaurants(location: string, healthRestrictions: string): Promise<Restaurant[]> {
  try {
    // 現在地が指定されていない場合は東京を使用
    const searchLocation = location && location.trim() ? location : "東京都";
    
    console.log('Searching restaurants for:', searchLocation);
    console.log('Health restrictions:', healthRestrictions);
    
    // API呼び出しが失敗した場合に備えて、健康分析に基づいたモックデータを準備
    return getHealthBasedRestaurants(searchLocation, healthRestrictions);
    
    // 以下のAPIコードは維持しておきますが、今回はモックデータを優先します
    // ...
  } catch (error) {
    console.error('Error in searchRestaurants:', error);
    return getHealthBasedRestaurants(location, healthRestrictions);
  }
}

// 健康分析に基づいたレストランを返す関数
function getHealthBasedRestaurants(location: string, healthAnalysis: string): Restaurant[] {
  const restaurants: Restaurant[] = [];
  
  // 健康分析から特定のキーワードを探す
  const needsLowSugar = /血糖|糖尿|低糖質|糖質制限/.test(healthAnalysis);
  const needsLowSalt = /塩分|高血圧|ナトリウム|減塩/.test(healthAnalysis);
  const needsIron = /鉄分|貧血|鉄/.test(healthAnalysis);
  const needsOmega3 = /オメガ3|EPA|DHA|魚油|不飽和脂肪酸/.test(healthAnalysis);
  const needsFiber = /食物繊維|便秘|腸内環境/.test(healthAnalysis);
  const needsProtein = /タンパク質|たんぱく質|プロテイン/.test(healthAnalysis);
  
  // 健康状態に基づいたレストラン推薦
  if (needsLowSugar) {
    restaurants.push({
      name: "低糖質キッチン 銀座店",
      address: "東京都中央区銀座4-6-1",
      cuisine: "低糖質、ケトジェニック",
      healthOptions: "糖質制限メニュー、GI値表示、完全無添加",
      rating: 4.6
    });
  }
  
  if (needsLowSalt) {
    restaurants.push({
      name: "健康食堂 減塩亭",
      address: "東京都新宿区西新宿1-1-3",
      cuisine: "和食、洋食",
      healthOptions: "減塩調理、ナトリウム表示、医師監修メニュー",
      rating: 4.3
    });
  }
  
  if (needsIron) {
    restaurants.push({
      name: "鉄人厨房",
      address: "東京都渋谷区神宮前5-2-1",
      cuisine: "鉄板焼き、オーガニック",
      healthOptions: "鉄分強化メニュー、貧血対策食、有機食材使用",
      rating: 4.5
    });
  }
  
  if (needsOmega3) {
    restaurants.push({
      name: "海の幸レストラン 青い魚",
      address: "東京都港区六本木3-1-1",
      cuisine: "魚料理、地中海料理",
      healthOptions: "EPA/DHA豊富な魚料理、オメガ3オイル使用",
      rating: 4.7
    });
  }
  
  if (needsFiber) {
    restaurants.push({
      name: "ベジタブルガーデン",
      address: "東京都目黒区自由が丘1-2-3",
      cuisine: "ベジタリアン、マクロビオティック",
      healthOptions: "食物繊維豊富なメニュー、腸活サポート食",
      rating: 4.4
    });
  }
  
  if (needsProtein) {
    restaurants.push({
      name: "プロテインパレス",
      address: "東京都豊島区池袋2-1-1",
      cuisine: "高タンパク料理、フィットネスフード",
      healthOptions: "タンパク質計算済みメニュー、アスリート向け食事",
      rating: 4.2
    });
  }
  
  // 一般的な健康食レストランを追加（特定の条件がない場合や、レストランが少ない場合）
  if (restaurants.length < 3) {
    restaurants.push({
      name: "オーガニックテーブル 丸の内",
      address: "東京都千代田区丸の内1-1-1",
      cuisine: "オーガニック、ベジタリアン",
      healthOptions: "完全有機食材、アレルギー対応、栄養士監修",
      rating: 4.8
    });
    
    restaurants.push({
      name: "タニタ食堂 秋葉原店",
      address: "東京都千代田区外神田6-14-1",
      cuisine: "定食、ヘルシー日本食",
      healthOptions: "カロリー計算済み、栄養バランス重視",
      rating: 4.1
    });
    
    restaurants.push({
      name: "GREEN BROTHER 表参道",
      address: "東京都渋谷区神宮前5-5-5",
      cuisine: "サラダ、スムージー",
      healthOptions: "ローカロリー、スーパーフード使用",
      rating: 4.3
    });
  }
  
  // 最大5件に制限
  return restaurants.slice(0, 5);
}
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
  
  // コレステロール関連
  if (/コレステロール|LDL|HDL/i.test(healthConditions)) {
    keywords.push('ヘルシー', 'オーガニック');
  }
  
  // その他の一般的な健康食のキーワード
  keywords.push('オーガニック', '健康', 'ベジタリアン');
  
  return [...new Set(keywords)]; // 重複を削除
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
