import styles from './HeroVisuals.module.css';

export function BarcodeScanner() {
  return (
    <div className={styles.barcodeScanner}>
      <div className={styles.barcodeLine} />
      <div className={styles.barcodeLines}>
        <div className={styles.barcode} />
        <div className={styles.barcode} />
        <div className={styles.barcode} />
        <div className={styles.barcode} />
        <div className={styles.barcode} />
        <div className={styles.barcode} />
        <div className={styles.barcode} />
        <div className={styles.barcode} />
      </div>
    </div>
  );
}

export function NutritionLabel() {
  return (
    <div className={styles.nutritionLabel}>
      <div className={styles.nutritionTitle}>Nutrition Facts</div>
      <div className={styles.nutritionRow}>
        <span>Calories</span>
        <span className={styles.nutritionValue}>150</span>
      </div>
      <div className={styles.nutritionRow}>
        <span>Protein</span>
        <span className={styles.nutritionValue}>8g</span>
      </div>
      <div className={styles.nutritionRow}>
        <span>Fiber</span>
        <span className={styles.nutritionValue}>5g</span>
      </div>
      <div className={styles.nutritionRow}>
        <span>Sugar</span>
        <span className={styles.nutritionValue}>2g</span>
      </div>
    </div>
  );
}

// Floating Food Category Cards with Real HD Images
interface FoodCardProps {
  image: string;
  category: string;
  score: number;
  position: 'left1' | 'left2' | 'left3' | 'left4' | 'right1' | 'right2' | 'right3' | 'right4';
}

function FoodCard({ image, category, score, position }: FoodCardProps) {
  return (
    <div className={`${styles.foodCard} ${styles[`foodCard${position}`]}`}>
      <div className={styles.foodCardInner}>
        <div className={styles.foodImageWrapper}>
          <img 
            src={image} 
            alt={category}
            className={styles.foodImage}
            loading="lazy"
          />
          <div className={styles.foodImageOverlay} />
        </div>
        <div className={styles.foodCardContent}>
          <div className={styles.foodCategory}>{category}</div>
          <div className={styles.foodScore}>
            <span className={styles.scoreValue}>{score}</span>
            <span className={styles.scoreLabel}>Trust</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FloatingFoodCards() {
  const foodCategories = [
    // Left side cards
    {
      image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=400&fit=crop&q=80',
      category: 'Organic',
      score: 95,
      position: 'left1' as const,
    },
    {
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop&q=80',
      category: 'Bakery',
      score: 92,
      position: 'left2' as const,
    },
    {
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop&q=80',
      category: 'Salads',
      score: 98,
      position: 'left3' as const,
    },
    {
      image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=400&fit=crop&q=80',
      category: 'Snacks',
      score: 85,
      position: 'left4' as const,
    },
    // Right side cards
    {
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop&q=80',
      category: 'Dairy',
      score: 88,
      position: 'right1' as const,
    },
    {
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop&q=80',
      category: 'Bowls',
      score: 90,
      position: 'right2' as const,
    },
    {
      image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=400&fit=crop&q=80',
      category: 'Drinks',
      score: 87,
      position: 'right3' as const,
    },
    {
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop&q=80',
      category: 'Grains',
      score: 94,
      position: 'right4' as const,
    },
  ];

  return (
    <div className={styles.floatingFoodCards}>
      {foodCategories.map((food, index) => (
        <FoodCard key={index} {...food} />
      ))}
    </div>
  );
}
