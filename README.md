# מנגל בלהבות

אתר ואפליקציית ניהול לעסק שמגיש מנגלים לאירועים. שני קבצי HTML עצמאיים, בלי תהליך build, שנשמרים ל-Firebase Firestore.

## הקבצים

- **`index.html`** - האתר הציבורי: גלריית תמונות, תפריטים לשלוש רמות אירוע (רגיל / רגיל+ / פרימיום) וטופס הזמנת אירוע (שם, טלפון, תאריך, כמות משתתפים, רמת אירוע, מיקום, הערות). בכל שליחה נוצר מסמך חדש ב-collection `mangalBookings` עם `status: "pending"`.
- **`admin.html`** - לוח ניהול פרטי (מקושר מהפוטר של `index.html` בלבד), מוגן בסיסמה שנקבעת בכניסה הראשונה (מוצפנת ב-SHA-256, נשמרת ב-`mangalSettings/admin`). כולל:
  - **בקשות חדשות** - התראה בתוך הלוח (בָּדג', צליל, כותרת הדף, והתראת דפדפן אם אושרה) על כל בקשת הזמנה חדשה, עם אישור/דחייה.
  - **לוח אירועים** - כל האירועים המאושרים, קרובים/עבר, ולחיצה על אירוע פותחת פרטים מלאים: מיקום, כמות משתתפים, סטטוס תשלום.
  - **חובות** - כל האירועים המאושרים שטרם שולמו במלואם, עם סכום חוב כולל.

## הרצה מקומית

אין תהליך build. פותחים את `index.html` ישירות בדפדפן, או מריצים שרת סטטי:

```bash
npx serve .
```

## הגדרת Firebase (חובה)

1. גשו ל-[Firebase Console](https://console.firebase.google.com) וצרו פרויקט חדש (חינמי).
2. **Build → Firestore Database → Create database**.
3. **Project settings → General → Your apps → Add app → Web**, וקבלו אובייקט `firebaseConfig`.
4. בשני הקבצים (`index.html` ו-`admin.html`) חפשו את הבלוק `const firebaseConfig = {...}` והחליפו בערכים שלכם.

## התאמה אישית

פתחו את `index.html` וחפשו `TODO-EDIT` - שם העסק, טלפון, וואטסאפ ומייל צריך להחליף לפרטים האמיתיים.
תמונות אמיתיות אפשר להוסיף לתיקייה `images/` ולעדכן את מערך `GALLERY` בקובץ.
את התפריטים עורכים במערך `MENUS` באותו קובץ.

## ⚠️ הגדרת אבטחה ב-Firebase (חשוב!)

מפתח ה-API של Firebase מוגדר בקוד. זה תקין ומקובל עבור אפליקציות צד-לקוח - **אבל** האבטחה האמיתית של הנתונים נקבעת ע"י **Firestore Security Rules**, שמוגדרים בקונסולת Firebase ולא בקוד הזה.

ההגנה על `admin.html` היא סיסמת אפליקציה בלבד (ללא Firebase Authentication אמיתי). מומלץ להגדיר בקונסולת Firebase (Firestore Database → Rules) חוקים לפי הדוגמה:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /mangalBookings/{id} {
      allow create: if true;                 // כל אחד יכול לשלוח בקשת הזמנה
      allow read, update, delete: if true;   // שקול להגביל בפרודקשן (למשל Firebase Auth)
    }
    match /mangalSettings/{id} {
      allow read, write: if true;            // שומר את הסיסמה המוצפנת של המנהל
    }
  }
}
```

## PWA / אחסון

האפליקציה אינה PWA כרגע (ללא manifest/service worker) - אפשר להוסיף בהמשך אם צריך.
