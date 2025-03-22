// DOMの読み込み完了後に実行
document.addEventListener('DOMContentLoaded', () => {
  // DOM要素の取得
  const healthForm = document.getElementById('health-form');
  const locationInput = document.getElementById('location');
  const loadingElement = document.getElementById('loading');
  const resultsElement = document.getElementById('results');
  const healthAdviceElement = document.getElementById('health-advice');
  const dietSuggestionsElement = document.getElementById('diet-suggestions');
  const restaurantsSection = document.getElementById('restaurants-section');
  const restaurantsElement = document.getElementById('restaurants');

  // 結果を表示する関数
  function displayResults(data) {
    try {
      console.log('Displaying results:', data);
      
      // 健康アドバイスを表示
// 健康アドバイスを表示
if (data.healthAdvice) {
  healthAdviceElement.innerHTML = data.healthAdvice;
} else {
  healthAdviceElement.innerHTML = `<p>健康データの分析結果を表示できません。</p>`;
}
      
      // 食事提案を表示
      if (data.dietSuggestions && Array.isArray(data.dietSuggestions) && data.dietSuggestions.length > 0) {
        dietSuggestionsElement.innerHTML = data.dietSuggestions
          .map(item => `
            <div class="food-item">
              <h3 class="h5">${item.name || '健康的な食事'}</h3>
              <p>${item.description || '詳細情報がありません'}</p>
              <p class="nutrition-info">${item.nutrition || '栄養情報がありません'}</p>
            </div>
          `)
          .join('');
      } else {
        dietSuggestionsElement.innerHTML = `
          <div class="food-item">
            <h3 class="h5">食事提案を表示できません</h3>
            <p>データが不足しているため、具体的な食事提案ができません。</p>
          </div>
        `;
      }
      
      // レストラン情報を表示
      if (data.restaurants && Array.isArray(data.restaurants) && data.restaurants.length > 0) {
        restaurantsSection.classList.remove('d-none');
        restaurantsElement.innerHTML = data.restaurants
          .map(restaurant => `
            <div class="restaurant-item">
              <h3 class="h5">${restaurant.name || 'レストラン情報なし'}</h3>
              <p class="mb-1">${restaurant.address || '住所情報なし'}</p>
              ${restaurant.cuisine ? `<p class="mb-1"><strong>ジャンル:</strong> ${restaurant.cuisine}</p>` : ''}
              ${restaurant.healthOptions ? `<p class="health-options mb-1"><strong>健康オプション:</strong> ${restaurant.healthOptions}</p>` : ''}
              ${restaurant.rating ? `<p class="rating mb-0"><strong>評価:</strong> ${restaurant.rating.toFixed(1)} ${'★'.repeat(Math.round(restaurant.rating))}</p>` : ''}
            </div>
          `)
          .join('');
      } else {
        restaurantsSection.classList.add('d-none');
      }
      
      // 結果表示
      resultsElement.classList.remove('d-none');
    } catch (error) {
      console.error('Error displaying results:', error);
      // エラー表示
      resultsElement.classList.remove('d-none');
      healthAdviceElement.innerHTML = '<p>表示中にエラーが発生しました。再度お試しください。</p>';
    }
  }

  // フォーム要素が存在するか確認
  if (healthForm) {
    // フォーム送信イベントリスナー
    healthForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      // すべての健康データ入力フィールドを取得
      const healthDataFields = healthForm.querySelectorAll('input[name]');
      const healthData = {};

function validateHealthData(healthData) {
  const validations = {
    bloodSugar: { min: 0, max: 500, name: '血糖値' },
    triglyceride: { min: 0, max: 1000, name: '中性脂肪' },
    HbA1c: { min: 0, max: 20, name: 'HbA1c' },
    // 他の項目も同様に追加
  };

  for (const [key, validation] of Object.entries(validations)) {
    if (healthData[key]) {
      const value = parseFloat(healthData[key]);
      
      if (isNaN(value)) {
        alert(`${validation.name}は数値で入力してください`);
        return false;
      }
      
      if (value < validation.min || value > validation.max) {
        alert(`${validation.name}は${validation.min}〜${validation.max}の範囲で入力してください`);
        return false;
      }
    }
  }
  
  return true;
}

// フォーム送信イベントリスナーで検証を追加
healthForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  // 健康データ収集
  const healthDataFields = healthForm.querySelectorAll('input[name]');
  const healthData = {};
  
  healthDataFields.forEach(field => {
    if (field.value.trim()) {
      healthData[field.name] = field.value.trim();
    }
  });
  
  // クライアント側検証
  if (!validateHealthData(healthData)) {
    return;
  }
  
  // 以下、既存の送信処理...
});
      
      // 入力値をオブジェクトに集約
      healthDataFields.forEach(field => {
        if (field.value.trim()) {
          healthData[field.name] = field.value.trim();
        }
      });
      
      const location = "東京都";
      
      if (Object.keys(healthData).length === 0) {
        alert('少なくとも1つの健康データを入力してください');
        return;
      }
      
      // UIの状態を更新
      loadingElement.classList.remove('d-none');
      resultsElement.classList.add('d-none');
      
      try {
        // APIリクエストを送信
        const response = await fetch('/api/recommend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ healthData, location })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        // レスポンスを確認
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed data:', data);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          // 解析エラーの場合、ダミーデータを生成
          data = {
            healthAdvice: "データの解析中にエラーが発生しました。血糖値や脂質プロファイルなどの健康指標に基づいた食事制限が推奨されます。",
            dietSuggestions: [
              {
                name: "バランスの良い日本食",
                description: "玄米、焼き魚、季節の野菜の煮物を中心とした低塩分・低脂質の食事",
                nutrition: "カロリー: 450kcal, 炭水化物: 60g, タンパク質: 25g, 脂質: 10g"
              }
            ],
            restaurants: []
          };
        }
        
        // 結果を表示
        displayResults(data);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        alert('レコメンデーションの取得中にエラーが発生しました: ' + error.message);
        
        // エラー時もローディングを非表示
        loadingElement.classList.add('d-none');
        
        // エラー時のフォールバックデータ
        const fallbackData = {
          healthAdvice: "データの取得中にエラーが発生しました。一般的な健康的な食事習慣を心がけてください。",
          dietSuggestions: [
            {
              name: "バランスの良い和食",
              description: "玄米、焼き魚、季節の野菜など、バランスの取れた和食中心の食事",
              nutrition: "カロリー: 400-500kcal程度、適切な栄養バランス"
            }
          ],
          restaurants: []
        };
        
        // エラー時も結果を表示
        displayResults(fallbackData);
      } finally {
        // 必ずローディングを非表示にする
        loadingElement.classList.add('d-none');
      }
    });
  } else {
    console.error('Form element with ID "health-form" not found');
  }
});
