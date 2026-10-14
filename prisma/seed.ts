import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create or ensure single User
  const user = await prisma.user.upsert({
    where: { id: "default-student" },
    update: {},
    create: {
      id: "default-student",
      name: "Alex",
      targetLevel: "B2",
      currentCefr: "A1",
      streakDays: 3,
      lastActiveDate: new Date(),
    },
  });

  // 2. Levels
  const levelsData = [
    {
      id: "A1",
      name: "Beginner",
      description: "Basic everyday expressions, personal introductions, simple daily interactions.",
      orderIndex: 1,
    },
    {
      id: "A2",
      name: "Elementary",
      description: "Everyday routines, past events, simple shopping, travel, and personal background.",
      orderIndex: 2,
    },
    {
      id: "B1",
      name: "Intermediate",
      description: "Connecting ideas, narrating experiences, expressing opinions, conditionals, and passive voice.",
      orderIndex: 3,
    },
    {
      id: "B2",
      name: "Upper Intermediate",
      description: "Nuanced communication, complex grammar, professional registers, and essay arguments.",
      orderIndex: 4,
    },
  ];

  for (const lvl of levelsData) {
    await prisma.level.upsert({
      where: { id: lvl.id },
      update: lvl,
      create: lvl,
    });
  }

  // 3. Chapters and Lessons
  // Let's create structured chapters & lessons for all 4 levels

  // --- LEVEL A1 ---
  const a1Ch1 = await prisma.chapter.create({
    data: {
      levelId: "A1",
      title: "Introductions & Personal Details",
      description: "Learn how to introduce yourself, greet others, and exchange basic information.",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      chapterId: a1Ch1.id,
      title: "Greetings and Personal Pronouns",
      slug: "greetings-and-personal-pronouns",
      orderIndex: 1,
      objectives: JSON.stringify([
        "Master formal and informal greetings (Hello, Good morning, Hi)",
        "Understand subject pronouns: I, you, he, she, it, we, they",
        "Formulate your first English introductions",
      ]),
      grammarExplanation: `### Subject Pronouns & Greetings
In English, sentences almost always need an explicit subject pronoun.

| Pronoun | Meaning (VN) | Example |
|---|---|---|
| **I** | Tôi | I am Lan. |
| **You** | Bạn / Các bạn | You are welcome. |
| **He** | Anh ấy / Cậu ấy | He is Tom. |
| **She** | Cô ấy / Chị ấy | She is Sarah. |
| **It** | Nó (đồ vật/con vật) | It is a book. |
| **We** | Chúng tôi / Chúng ta | We are students. |
| **They** | Họ / Chúng nó | They are teachers. |

**Common Greetings:**
- **Good morning**: Chào buổi sáng (before 12 PM)
- **Good afternoon**: Chào buổi chiều (12 PM - 6 PM)
- **Good evening**: Chào buổi tối (after 6 PM)
- **Nice to meet you**: Rất vui được gặp bạn`,
      vietnameseNotes: "Trong tiếng Anh, đại từ nhân xưng đóng vai trò chủ ngữ (I, you, he, she, it, we, they) luôn phải xuất hiện rõ ràng trước động từ, không được lược bỏ như trong tiếng Việt.",
      readingPassage: "Hello! My name is Minh. I am twenty-two years old and I live in Hanoi. I am a university student. Every morning, I say 'Good morning' to my roommate David. He is from Australia. We are good friends.",
      readingPassageVn: "Xin chào! Tên tôi là Minh. Tôi 22 tuổi và tôi sống ở Hà Nội. Tôi là một sinh viên đại học. Mỗi buổi sáng, tôi chào 'Chào buổi sáng' với bạn cùng phòng của tôi là David. Anh ấy đến từ Úc. Chúng tôi là bạn tốt.",
      listeningScript: "Good morning! My name is Sarah. Nice to meet you. Are you a new student here? Yes, I am. Welcome to our English class!",
      summary: "You have learned how to greet people at different times of day and use the 7 core subject pronouns accurately.",
      exercises: {
        create: [
          {
            type: "mcq",
            prompt: "Choose the correct pronoun: '___ is a doctor.' (talking about a female friend)",
            promptVn: "Chọn đại từ đúng để chỉ một người bạn nữ:",
            optionsJson: JSON.stringify(["He", "She", "They", "It"]),
            answer: "She",
            explanation: "'She' is the third-person singular feminine subject pronoun in English.",
            orderIndex: 1,
          },
          {
            type: "fill_blank",
            prompt: "Fill in the blank: 'Nice to ___ you!'",
            promptVn: "Điền vào chỗ trống: 'Rất vui được gặp bạn!'",
            optionsJson: null,
            answer: "meet",
            explanation: "The standard friendly phrase is 'Nice to meet you'.",
            orderIndex: 2,
          },
          {
            type: "reorder",
            prompt: "Arrange the words in correct order: [friends / We / good / are]",
            promptVn: "Sắp xếp lại câu thành câu hoàn chỉnh:",
            optionsJson: null,
            answer: "We are good friends",
            explanation: "Subject (We) + Verb to be (are) + Adjective (good) + Noun (friends).",
            orderIndex: 3,
          },
        ],
      },
    },
  });

  await prisma.lesson.create({
    data: {
      chapterId: a1Ch1.id,
      title: "The Verb 'To Be': Am, Is, Are",
      slug: "verb-to-be",
      orderIndex: 2,
      objectives: JSON.stringify([
        "Form positive, negative, and question forms of 'to be'",
        "Use contractions (I'm, He's, They're)",
        "Ask and answer simple personal questions",
      ]),
      grammarExplanation: `### The Verb 'To Be' in Present Simple
'To be' expresses identity, age, feelings, nationality, and location.

#### 1. Affirmative (+)
- **I am** -> *I'm*
- **He / She / It is** -> *He's / She's / It's*
- **You / We / They are** -> *You're / We're / They're*

#### 2. Negative (-)
Add **not** after the verb:
- *I am not* (I'm not)
- *He is not* (He isn't)
- *They are not* (They aren't)

#### 3. Questions (?)
Invert the subject and the verb:
- *Are you a student?* -> Yes, I am. / No, I'm not.
- *Is she ready?* -> Yes, she is. / No, she isn't.`,
      vietnameseNotes: "Động từ 'To be' mang nghĩa 'thì, là, ở'. Khi làm câu hỏi, ta đảo 'Am/Is/Are' lên trước chủ ngữ. Phủ định thêm 'not' ngay sau to be.",
      readingPassage: "This is Mai. She is twenty-four years old. She is not a student anymore; she is an English teacher. Her students are very friendly and energetic. Mai is always happy in the classroom.",
      readingPassageVn: "Đây là Mai. Cô ấy 24 tuổi. Cô ấy không còn là sinh viên nữa; cô ấy là một giáo viên tiếng Anh. Học sinh của cô ấy rất thân thiện và tràn đầy năng lượng. Mai luôn hạnh phúc trong lớp học.",
      listeningScript: "Excuse me, are you Peter? No, I am not. I am Michael. Peter is over there near the library door.",
      summary: "You now understand how to conjugate and invert 'to be' across affirmative, negative, and interrogative sentences.",
      exercises: {
        create: [
          {
            type: "mcq",
            prompt: "Complete the sentence: 'They ___ at home right now.'",
            promptVn: "Điền vào chỗ trống: Họ đang ở nhà ngay lúc này.",
            optionsJson: JSON.stringify(["is", "am", "are", "be"]),
            answer: "are",
            explanation: "Subject 'They' takes the plural form 'are'.",
            orderIndex: 1,
          },
          {
            type: "fill_blank",
            prompt: "Complete the negative: 'He ___ not tired.'",
            promptVn: "Hoàn thành câu phủ định:",
            optionsJson: null,
            answer: "is",
            explanation: "'He' takes 'is', so the negative is 'He is not' or 'He isn't'.",
            orderIndex: 2,
          },
        ],
      },
    },
  });

  const a1Ch2 = await prisma.chapter.create({
    data: {
      levelId: "A1",
      title: "Everyday Habits & Routines",
      description: "Talk about daily life, schedules, and everyday activities.",
      orderIndex: 2,
    },
  });

  await prisma.lesson.create({
    data: {
      chapterId: a1Ch2.id,
      title: "Present Simple: Habits and Facts",
      slug: "present-simple-habits",
      orderIndex: 1,
      objectives: JSON.stringify([
        "Express daily routines and universal truths",
        "Master the 3rd person singular -s/-es rule (he works, she watches)",
        "Use auxiliary verbs do/does in negatives and questions",
      ]),
      grammarExplanation: `### Present Simple Tense (Hiện tại đơn)
We use the Present Simple for things that happen regularly or are always true.

#### Rules for 3rd Person Singular (He / She / It)
- Most verbs: add **-s** (work -> works, read -> reads)
- Verbs ending in -ch, -sh, -ss, -x, -o: add **-es** (watch -> watches, go -> goes)
- Consonant + -y: change to **-ies** (study -> studies)

#### Negatives & Questions
Use auxiliary verb **do / does**:
- (+) *She drinks tea every morning.*
- (-) *She does not (doesn't) drink coffee.*
- (?) *Do you drink coffee?* -> Yes, I do. / No, I don't.`,
      vietnameseNotes: "Thì hiện tại đơn dùng diễn tả thói quen, chân lý. Chú ý ngôi thứ ba số ít (he/she/it) động từ phải thêm -s hoặc -es. Khi đã dùng mượn trợ động từ does/doesn't thì động từ chính trở về nguyên thể (bare infinitive).",
      readingPassage: "Liam wakes up at 6:30 AM every weekday. He drinks a glass of warm water, eats a bowl of cereal, and leaves for work at 7:15 AM. Liam does not drive a car; he takes the green subway line.",
      readingPassageVn: "Liam thức dậy lúc 6:30 sáng mỗi ngày trong tuần. Anh ấy uống một ly nước ấm, ăn một bát ngũ cốc, và đi làm lúc 7:15. Liam không lái ô tô; anh ấy đi tàu điện ngầm tuyến màu xanh lá.",
      listeningScript: "Do you exercise in the morning? Yes, I run three kilometers every day before breakfast.",
      summary: "Mastered the Present Simple for describing habits, schedules, and general truths with correct subject-verb agreement.",
      exercises: {
        create: [
          {
            type: "mcq",
            prompt: "Choose the correct sentence: ",
            promptVn: "Chọn câu đúng ngữ pháp:",
            optionsJson: JSON.stringify([
              "She watch TV every evening.",
              "She watches TV every evening.",
              "She watching TV every evening.",
              "She is watch TV every evening.",
            ]),
            answer: "She watches TV every evening.",
            explanation: "With 'She', the verb 'watch' ends in -ch so we add -es: 'watches'.",
            orderIndex: 1,
          },
          {
            type: "fill_blank",
            prompt: "Fill in the blank with do or does: '___ your brother work in a bank?'",
            promptVn: "Điền trợ động từ phù hợp:",
            optionsJson: null,
            answer: "Does",
            explanation: "'your brother' is equivalent to 'he', so we use 'Does'.",
            orderIndex: 2,
          },
        ],
      },
    },
  });

  // --- LEVEL A2 ---
  const a2Ch1 = await prisma.chapter.create({
    data: {
      levelId: "A2",
      title: "Past Events & Experiences",
      description: "Talk about what happened yesterday, last week, and memorable past events.",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      chapterId: a2Ch1.id,
      title: "Past Simple: Regular & Irregular Verbs",
      slug: "past-simple-verbs",
      orderIndex: 1,
      objectives: JSON.stringify([
        "Form regular past tense verbs with -ed",
        "Memorize essential irregular verbs (go -> went, have -> had, see -> saw)",
        "Use 'did / didn't' for questions and negative sentences",
      ]),
      grammarExplanation: `### Past Simple Tense (Quá khứ đơn)
Used for actions completed at a specific time in the past.

#### 1. Regular Verbs (-ed)
- play -> played
- visit -> visited
- stop -> stopped (double consonant)

#### 2. Common Irregular Verbs
- go -> **went**
- see -> **saw**
- buy -> **bought**
- make -> **made**
- take -> **took**

#### 3. Negative and Questions
Use **did / didn't** + base verb:
- (-) *We didn't go to the beach yesterday.* (NOT: didn't went)
- (?) *Did you see the movie last night?* -> Yes, I did.`,
      vietnameseNotes: "Thì quá khứ đơn diễn tả hành động đã hoàn tất trong quá khứ tại thời điểm xác định (yesterday, last year, two days ago). Cực kỳ lưu ý: khi đã có trợ động từ 'did' hoặc 'didn't', động từ theo sau phải ở dạng nguyên thể.",
      readingPassage: "Last summer, Linh traveled to Da Nang with her family. They stayed in a small hotel near the beach. Every morning, they walked along the coast and ate delicious seafood. On the third day, they visited the Marble Mountains and took over two hundred photographs.",
      readingPassageVn: "Mùa hè năm ngoái, Linh đã đi du lịch Đà Nẵng cùng gia đình. Họ ở trong một khách sạn nhỏ gần bãi biển. Mỗi sáng, họ đi dạo dọc bờ biển và ăn hải sản thơm ngon. Vào ngày thứ ba, họ đã thăm Ngũ Hành Sơn và chụp hơn hai trăm bức ảnh.",
      listeningScript: "Did you finish the financial report yesterday? Yes, I sent it to Mr. Johnson before five o'clock.",
      summary: "You can now narrate past events using both regular -ed and irregular verbs.",
      exercises: {
        create: [
          {
            type: "mcq",
            prompt: "What is the past simple of 'buy'?",
            promptVn: "Dạng quá khứ đơn của động từ 'buy' là gì?",
            optionsJson: JSON.stringify(["buyed", "bought", "bring", "bough"]),
            answer: "bought",
            explanation: "'Buy' is an irregular verb: buy -> bought -> bought.",
            orderIndex: 1,
          },
          {
            type: "fill_blank",
            prompt: "Complete the sentence: 'We didn't ___ (see) him at the meeting.'",
            promptVn: "Điền dạng đúng của động từ trong ngoặc:",
            optionsJson: null,
            answer: "see",
            explanation: "After 'didn't', the verb remains in base form: 'see'.",
            orderIndex: 2,
          },
        ],
      },
    },
  });

  const a2Ch2 = await prisma.chapter.create({
    data: {
      levelId: "A2",
      title: "Comparisons & Choices",
      description: "Compare two or more things, evaluate options, and express preferences.",
      orderIndex: 2,
    },
  });

  await prisma.lesson.create({
    data: {
      chapterId: a2Ch2.id,
      title: "Comparatives and Superlatives",
      slug: "comparatives-and-superlatives",
      orderIndex: 1,
      objectives: JSON.stringify([
        "Form short adjective comparatives (-er than) and superlatives (the -est)",
        "Form long adjective comparatives (more ... than) and superlatives (the most ...)",
        "Handle irregular adjectives: good -> better -> best, bad -> worse -> worst",
      ]),
      grammarExplanation: `### Comparatives & Superlatives (So sánh hơn & So sánh nhất)

#### 1. Short Adjectives (1 syllable)
- Comparative: add **-er than** (*tall -> taller than*)
- Superlative: **the -est** (*the tallest*)

#### 2. Long Adjectives (2+ syllables)
- Comparative: **more ... than** (*more expensive than*)
- Superlative: **the most ...** (*the most expensive*)

#### 3. Irregular Forms
- good -> **better than** -> **the best**
- bad -> **worse than** -> **the worst**
- far -> **further / farther than** -> **the furthest**`,
      vietnameseNotes: "So sánh hơn dùng để so sánh 2 đối tượng, có từ 'than'. So sánh nhất dùng để so sánh 1 đối tượng với toàn bộ nhóm (3 đối tượng trở lên), luôn có mạo từ 'the'.",
      readingPassage: "Choosing a laptop can be tricky. Brand A is lighter and cheaper than Brand B, but Brand B has a much longer battery life. For professional video editors, Brand C is definitely the most powerful option on the market.",
      readingPassageVn: "Chọn một chiếc laptop có thể khá khó khăn. Hãng A nhẹ hơn và rẻ hơn Hãng B, nhưng Hãng B có thời lượng pin lâu hơn nhiều. Đối với các nhà biên tập video chuyên nghiệp, Hãng C chắc chắn là lựa chọn mạnh mẽ nhất trên thị trường.",
      listeningScript: "Which city is bigger, Hanoi or Ho Chi Minh City? Ho Chi Minh City is larger in population and area.",
      summary: "You can accurately compare products, places, and people using comparative and superlative forms.",
      exercises: {
        create: [
          {
            type: "mcq",
            prompt: "Choose the correct sentence: 'This book is ___ than the movie.'",
            promptVn: "Điền vào chỗ trống:",
            optionsJson: JSON.stringify([
              "more interesting",
              "interestinger",
              "most interesting",
              "as interesting",
            ]),
            answer: "more interesting",
            explanation: "'Interesting' has 4 syllables, so we use 'more interesting than'.",
            orderIndex: 1,
          },
          {
            type: "fill_blank",
            prompt: "Fill in the blank: 'It was the ___ (good) day of my life!'",
            promptVn: "Điền dạng so sánh nhất của từ 'good':",
            optionsJson: null,
            answer: "best",
            explanation: "The superlative of 'good' is 'best' (the best).",
            orderIndex: 2,
          },
        ],
      },
    },
  });

  // --- LEVEL B1 ---
  const b1Ch1 = await prisma.chapter.create({
    data: {
      levelId: "B1",
      title: "Connecting Time & Consequences",
      description: "Master the bridge between past and present, and reason about hypothetical conditions.",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      chapterId: b1Ch1.id,
      title: "Present Perfect vs Past Simple",
      slug: "present-perfect-vs-past-simple",
      orderIndex: 1,
      objectives: JSON.stringify([
        "Form the Present Perfect (have/has + past participle)",
        "Understand when to use Present Perfect (life experiences, unfinished time, results now)",
        "Distinguish clearly from Past Simple (specific finished past time)",
      ]),
      grammarExplanation: `### Present Perfect vs Past Simple
This is one of the most vital distinctions in intermediate English.

#### Present Perfect (have / has + V3/ed)
Use for:
1. **Life experiences** (without mentioning exact time): *I have visited Japan twice.*
2. **Actions starting in past continuing to now**: *She has lived here for five years.*
3. **Recent actions with a present result**: *I have lost my key (I can't open the door now).*
Keywords: *already, yet, ever, never, since, for, just, recently*.

#### Past Simple (V2/ed)
Use when the time is **finished and specific**:
- *I visited Japan in 2019.* (Finished year)
- *She moved here five years ago.*`,
      vietnameseNotes: "Thì Hiện tại hoàn thành nhấn mạnh trải nghiệm hoặc kết quả liên quan đến hiện tại (không nêu rõ thời điểm cụ thể). Nếu có mốc thời gian đã kết thúc trong quá khứ (yesterday, last week, in 2018, when I was young), BẮT BUỘC dùng Quá khứ đơn.",
      readingPassage: "Dr. Elena Vance has worked in renewable energy research for over a decade. Since 2015, her laboratory has published forty academic papers on solar battery longevity. However, when she started her career in London, funding was scarce and many investors doubted clean technology.",
      readingPassageVn: "Tiến sĩ Elena Vance đã làm việc trong lĩnh vực nghiên cứu năng lượng tái tạo hơn một thập kỷ. Kể từ năm 2015, phòng thí nghiệm của bà đã xuất bản bốn mươi bài báo khoa học về tuổi thọ pin mặt trời. Tuy nhiên, khi bà bắt đầu sự nghiệp ở London, nguồn vốn rất khan hiếm và nhiều nhà đầu tư hoài nghi công nghệ sạch.",
      listeningScript: "Have you ever tried rock climbing? Yes, I went climbing in the Alps three years ago. It was breathtaking.",
      summary: "You can now choose confidently between Present Perfect and Past Simple depending on whether the timeframe is finished or connected to the present.",
      exercises: {
        create: [
          {
            type: "mcq",
            prompt: "Choose the correct verb form: 'I ___ my homework yet.'",
            promptVn: "Chọn dạng đúng của động từ:",
            optionsJson: JSON.stringify([
              "haven't finished",
              "didn't finish",
              "not finish",
              "haven't finish",
            ]),
            answer: "haven't finished",
            explanation: "'yet' in negative sentences indicates Present Perfect: haven't finished.",
            orderIndex: 1,
          },
          {
            type: "mcq",
            prompt: "Choose the correct sentence: ",
            promptVn: "Chọn câu đúng nhất:",
            optionsJson: JSON.stringify([
              "I have seen him yesterday.",
              "I saw him yesterday.",
              "I have saw him yesterday.",
              "I did see him since yesterday.",
            ]),
            answer: "I saw him yesterday.",
            explanation: "'yesterday' is a completed past time, requiring the Past Simple 'saw'.",
            orderIndex: 2,
          },
        ],
      },
    },
  });

  await prisma.lesson.create({
    data: {
      chapterId: b1Ch1.id,
      title: "First and Second Conditionals",
      slug: "first-and-second-conditionals",
      orderIndex: 2,
      objectives: JSON.stringify([
        "Form First Conditional for real and likely future possibilities (If + present, will + verb)",
        "Form Second Conditional for unreal, hypothetical, or imaginary situations (If + past, would + verb)",
        "Understand the difference in speaker certainty and attitude",
      ]),
      grammarExplanation: `### First vs Second Conditionals (Câu điều kiện loại 1 & 2)

#### 1. First Conditional (Real / Probable Future)
- **Structure**: If + Present Simple, will + base verb
- **Usage**: Real conditions that are likely to happen.
- *If it rains tomorrow, we will stay at home.*
- *If you study hard, you will pass the B1 exam.*

#### 2. Second Conditional (Unreal / Imaginary Present or Future)
- **Structure**: If + Past Simple, would + base verb
- **Usage**: Hypothetical, improbable, or impossible current situations.
- *If I won the lottery, I would buy a house for my parents.* (Unlikely)
- *If I were you, I would accept the job offer.* (Giving advice - use 'were' for all persons in formal English).`,
      vietnameseNotes: "Câu điều kiện loại 1 nói về việc có thật hoặc rất có thể xảy ra trong tương lai (If + Hiện tại đơn, S + will + V). Câu điều kiện loại 2 nói về việc giả định, không có thật ở hiện tại hoặc tương lai (If + Quá khứ đơn, S + would + V). Trong văn phong trang trọng, 'were' được dùng cho tất cả các ngôi (If I were you).",
      readingPassage: "Many young entrepreneurs wonder how to scale their businesses. If you identify a genuine customer problem, people will gladly pay for your solution. On the other hand, if we had unlimited capital tomorrow, we would still need disciplined focus. Success is rarely just about money.",
      readingPassageVn: "Nhiều doanh nhân trẻ băn khoăn về cách mở rộng doanh nghiệp của họ. Nếu bạn xác định được một vấn đề thực sự của khách hàng, mọi người sẽ sẵn lòng trả tiền cho giải pháp của bạn. Mặt khác, nếu ngày mai chúng ta có số vốn không giới hạn, chúng ta vẫn cần sự tập trung kỷ luật. Thành công hiếm khi chỉ phụ thuộc vào tiền bạc.",
      listeningScript: "What would you do if you lost your passport in a foreign country? If I lost my passport, I would immediately contact my country's embassy.",
      summary: "Understood the structural and philosophical differences between real future possibilities (Type 1) and imaginary hypotheticals (Type 2).",
      exercises: {
        create: [
          {
            type: "mcq",
            prompt: "Complete the sentence: 'If I ___ more free time, I would learn Spanish.'",
            promptVn: "Điền dạng đúng của động từ:",
            optionsJson: JSON.stringify(["have", "had", "will have", "would have"]),
            answer: "had",
            explanation: "The main clause has 'would learn' (Second Conditional), so the if-clause takes the Past Simple: 'had'.",
            orderIndex: 1,
          },
          {
            type: "fill_blank",
            prompt: "Fill in the blank: 'If she passes the exam, she ___ travel to Europe.' (will / would)",
            promptVn: "Điền will hoặc would vào chỗ trống:",
            optionsJson: null,
            answer: "will",
            explanation: "The if-clause is in the Present Simple ('passes'), making this a First Conditional sentence requiring 'will'.",
            orderIndex: 2,
          },
        ],
      },
    },
  });

  // --- LEVEL B2 ---
  const b2Ch1 = await prisma.chapter.create({
    data: {
      levelId: "B2",
      title: "Advanced Syntax & Rhetoric",
      description: "Express sophisticated relationships, nuanced stances, and master academic registers.",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      chapterId: b2Ch1.id,
      title: "Mixed Conditionals and Inversion",
      slug: "mixed-conditionals-inversion",
      orderIndex: 1,
      objectives: JSON.stringify([
        "Form past condition with present result (If + past perfect, would + verb)",
        "Form present condition with past result (If + past simple, would have + V3)",
        "Use inverted conditional structures (Had I known, Were he to ask)",
      ]),
      grammarExplanation: `### Mixed Conditionals & Inversion

#### 1. Past Cause -> Present Result
Condition happened in the past, but the result is being felt right now.
- **Pattern**: If + Past Perfect (had + V3), would + base verb (now)
- *If I had taken that flight yesterday, I would be in Tokyo right now.*
- (Reality: I didn't take the flight yesterday, so I am not in Tokyo now).

#### 2. Present State -> Past Result
A permanent personal trait or current reality influenced a past outcome.
- **Pattern**: If + Past Simple, would have + V3
- *If she were not so stubborn, she would have accepted their apology.*

#### 3. Formal Inversion (Omitting 'If')
In formal writing, omit 'if' and invert the auxiliary verb:
- *Had I known about the schedule change, I would have notified the team.* (If I had known...)
- *Were you to require further assistance, please contact our support desk.* (If you were to require...)`,
      vietnameseNotes: "Câu điều kiện hỗn hợp (Mixed Conditionals) liên kết hai khoảng thời gian khác nhau giữa vế giả thiết và vế kết quả (ví dụ: quá khứ tác động tới hiện tại). Đảo ngữ câu điều kiện (Inversion) bỏ 'If' và đảo trợ động từ (Had / Were / Should) lên đầu câu để tạo phong thái trang trọng, học thuật.",
      readingPassage: "Had the committee evaluated the structural integrity reports earlier, the catastrophic bridge collapse would have been completely averted. Furthermore, if the municipal council were not so bureaucratic, modern safety protocols would already be implemented across the entire transit network. The inquiry highlights how administrative inertia exacerbates engineering risks.",
      readingPassageVn: "Nếu ủy ban đánh giá các báo cáo về độ toàn vẹn cấu trúc sớm hơn, vụ sập cầu thảm khốc đã hoàn toàn có thể được ngăn chặn. Hơn nữa, nếu hội đồng thành phố không quá quan liêu, các quy chuẩn an toàn hiện đại đã được áp dụng trên toàn bộ mạng lưới giao thông ngay lúc này. Cuộc điều tra nhấn mạnh sự trì trệ hành chính làm trầm trọng thêm các rủi ro kỹ thuật như thế nào.",
      listeningScript: "Had you been informed of the policy revision prior to the conference? No, had we received that memorandum, we would certainly have revised our keynote presentation.",
      summary: "You can articulate complex cause-and-effect relationships across differing timelines and deploy inverted formal structures.",
      exercises: {
        create: [
          {
            type: "mcq",
            prompt: "Choose the correct sentence: '___ I known about the heavy traffic, I would have taken the metro.'",
            promptVn: "Chọn từ đảo ngữ thích hợp:",
            optionsJson: JSON.stringify(["Had", "Were", "Did", "If had"]),
            answer: "Had",
            explanation: "Formal inversion for past conditional: 'Had I known...' is equivalent to 'If I had known...'.",
            orderIndex: 1,
          },
          {
            type: "fill_blank",
            prompt: "Complete the mixed conditional: 'If I had won that scholarship last year, I ___ (be) studying in Canada today.'",
            promptVn: "Điền dạng đúng của động từ:",
            optionsJson: null,
            answer: "would be",
            explanation: "Past event ('had won') impacting present status ('today') requires 'would be'.",
            orderIndex: 2,
          },
        ],
      },
    },
  });

  await prisma.lesson.create({
    data: {
      chapterId: b2Ch1.id,
      title: "Nuance, Register, and Academic Arguments",
      slug: "nuance-register-academic-writing",
      orderIndex: 2,
      objectives: JSON.stringify([
        "Distinguish between colloquial, neutral, and academic registers",
        "Use hedging and cautious language (tends to, appears to, it is arguably)",
        "Structure cohesive arguments using advanced discourse markers",
      ]),
      grammarExplanation: `### Academic Register & Hedging
At B2 level, language becomes less categorical and more reasoned.

#### 1. Hedging (Cautious Language)
Avoid sweeping generalizations:
- *Colloquial/Absolute*: Technology ruins children's social skills.
- *Academic/Nuanced*: Evidence suggests that excessive screen exposure **may adversely affect** adolescent interpersonal development.

Hedging devices:
- Verbs: *tend to, seem to, appear to, suggest, indicate*
- Adverbs: *arguably, predominantly, moderately, potentially*
- Phrases: *It is widely recognized that... / There is substantial evidence that...*

#### 2. Advanced Discourse Markers
- **Contrasting**: *Notwithstanding, whereas, conversely, while it is true that...*
- **Adding / Reinforcing**: *Furthermore, moreover, in addition to this...*
- **Concluding**: *Consequently, thereby, it follows that...*`,
      vietnameseNotes: "Ở trình độ B2, người học cần sử dụng ngôn từ học thuật (academic register) và kỹ thuật nói giảm/nói tránh (hedging) để câu văn khách quan, thuyết phục và có chiều sâu, tránh khẳng định tuyệt đối một cách phiến diện.",
      readingPassage: "Urban sprawl poses unprecedented challenges to contemporary environmental management. While advocates of suburban expansion contend that decentralized housing enhances domestic comfort, environmental analyses demonstrate that low-density development invariably amplifies carbon emissions and encroaches upon vital agricultural reserves. Consequently, urban planners increasingly advocate compact, transit-oriented frameworks.",
      readingPassageVn: "Sự mở rộng đô thị tự phát đặt ra những thách thức chưa từng có đối với quản lý môi trường đương đại. Trong khi những người ủng hộ việc mở rộng vùng ngoại ô lập luận rằng nhà ở phi tập trung làm tăng sự thoải mái cho gia đình, các phân tích môi trường chứng minh rằng sự phát triển mật độ thấp chắc chắn làm tăng lượng khí thải carbon và xâm lấn vào các khu bảo tồn nông nghiệp thiết yếu. Do đó, các nhà quy hoạch đô thị ngày càng ủng hộ các khuôn khổ nhỏ gọn, định hướng giao thông công cộng.",
      listeningScript: "Could you summarize the primary critique of the proposed fiscal legislation? It is argued that while the measure aims to stimulate venture capital, it may inadvertently exacerbate regional wealth disparities.",
      summary: "You have learned how to elevate essays and spoken discourse using cautious hedging, precise lexical choices, and formal discourse markers.",
      exercises: {
        create: [
          {
            type: "mcq",
            prompt: "Which sentence demonstrates appropriate academic hedging?",
            promptVn: "Câu nào thể hiện lối diễn đạt học thuật (hedging) đúng chuẩn?",
            optionsJson: JSON.stringify([
              "Social media completely destroys attention spans without exception.",
              "Research suggests that excessive digital stimuli may diminish sustained focus.",
              "Everyone knows that smartphones make kids stupid.",
              "There is no doubt that technology is 100% bad for humans.",
            ]),
            answer: "Research suggests that excessive digital stimuli may diminish sustained focus.",
            explanation: "Academic writing relies on tentative phrases like 'research suggests' and 'may diminish' rather than sweeping absolutes.",
            orderIndex: 1,
          },
        ],
      },
    },
  });

  // 4. Vocabulary Words Bank
  const vocabWords = [
    // A1
    {
      word: "hello",
      phonetic: "/həˈloʊ/",
      pos: "interjection",
      defEn: "Used as a greeting or to begin a conversation.",
      defVn: "Xin chào",
      exampleEn: "Hello! How are you doing today?",
      exampleVn: "Xin chào! Hôm nay bạn thế nào?",
      cefrLevel: "A1",
      topic: "Greetings",
      synonyms: "hi, greetings",
      collocations: "say hello, hello there",
    },
    {
      word: "friend",
      phonetic: "/frend/",
      pos: "noun",
      defEn: "A person whom one knows and with whom one has a bond of mutual affection.",
      defVn: "Người bạn, bạn bè",
      exampleEn: "Sarah is my best friend from high school.",
      exampleVn: "Sarah là người bạn thân nhất của tôi từ thời trung học.",
      cefrLevel: "A1",
      topic: "Relationships",
      synonyms: "companion, pal",
      collocations: "close friend, best friend, make friends",
    },
    {
      word: "water",
      phonetic: "/ˈwɔːtər/",
      pos: "noun",
      defEn: "A colorless, transparent liquid that forms the seas, lakes, and rain.",
      defVn: "Nước",
      exampleEn: "Please drink a glass of clean water.",
      exampleVn: "Làm ơn hãy uống một ly nước sạch.",
      cefrLevel: "A1",
      topic: "Food & Drinks",
      synonyms: "H2O",
      collocations: "drink water, bottle of water, cold water",
    },
    {
      word: "morning",
      phonetic: "/ˈmɔːrnɪŋ/",
      pos: "noun",
      defEn: "The period of time between midnight and noon, especially from sunrise to noon.",
      defVn: "Buổi sáng",
      exampleEn: "I usually read the newspaper every morning.",
      exampleVn: "Tôi thường đọc báo vào mỗi buổi sáng.",
      cefrLevel: "A1",
      topic: "Time",
      synonyms: "dawn, daybreak",
      collocations: "good morning, in the morning, early morning",
    },
    {
      word: "student",
      phonetic: "/ˈstuːdnt/",
      pos: "noun",
      defEn: "A person who is studying at a school or university.",
      defVn: "Học sinh, sinh viên",
      exampleEn: "The student asked an interesting question.",
      exampleVn: "Người sinh viên đã hỏi một câu hỏi thú vị.",
      cefrLevel: "A1",
      topic: "Education",
      synonyms: "pupil, learner",
      collocations: "university student, good student, full-time student",
    },

    // A2
    {
      word: "journey",
      phonetic: "/ˈdʒɜːrni/",
      pos: "noun",
      defEn: "An act of traveling from one place to another.",
      defVn: "Chuyến đi, cuộc hành trình",
      exampleEn: "The train journey took nearly four hours.",
      exampleVn: "Chuyến đi bằng tàu hỏa mất gần bốn tiếng đồng hồ.",
      cefrLevel: "A2",
      topic: "Travel",
      synonyms: "trip, travel, voyage",
      collocations: "long journey, safe journey, embark on a journey",
    },
    {
      word: "delicious",
      phonetic: "/dɪˈlɪʃəs/",
      pos: "adjective",
      defEn: "Highly pleasing to the sense of taste.",
      defVn: "Ngon miệng, thơm ngon",
      exampleEn: "My grandmother cooked a delicious meal.",
      exampleVn: "Bà tôi đã nấu một bữa ăn ngon tuyệt.",
      cefrLevel: "A2",
      topic: "Food & Drinks",
      synonyms: "tasty, flavorful, yummy",
      collocations: "delicious food, delicious meal, smell delicious",
    },
    {
      word: "weather",
      phonetic: "/ˈweðər/",
      pos: "noun",
      defEn: "The state of the atmosphere at a place and time regarding heat, cloudiness, dryness, etc.",
      defVn: "Thời tiết",
      exampleEn: "The weather in Da Lat is cool and pleasant.",
      exampleVn: "Thời tiết ở Đà Lạt se lạnh và dễ chịu.",
      cefrLevel: "A2",
      topic: "Nature",
      synonyms: "climate",
      collocations: "bad weather, beautiful weather, weather forecast",
    },
    {
      word: "decide",
      phonetic: "/dɪˈsaɪd/",
      pos: "verb",
      defEn: "Come to a resolution in the mind as a result of consideration.",
      defVn: "Quyết định",
      exampleEn: "They decided to move to a new apartment.",
      exampleVn: "Họ đã quyết định chuyển sang một căn hộ mới.",
      cefrLevel: "A2",
      topic: "Actions",
      synonyms: "choose, resolve, determine",
      collocations: "decide to do, decide on, hard to decide",
    },

    // B1
    {
      word: "opportunity",
      phonetic: "/ˌɑːpərˈtuːnəti/",
      pos: "noun",
      defEn: "A set of circumstances that makes it possible to do something.",
      defVn: "Cơ hội, thời cơ",
      exampleEn: "Studying abroad provides a great opportunity to practice English.",
      exampleVn: "Du học mang lại một cơ hội tuyệt vời để thực hành tiếng Anh.",
      cefrLevel: "B1",
      topic: "Career & Education",
      synonyms: "chance, opening, occasion",
      collocations: "take the opportunity, golden opportunity, equal opportunities",
    },
    {
      word: "environment",
      phonetic: "/ɪnˈvaɪrənmənt/",
      pos: "noun",
      defEn: "The surroundings or conditions in which a person, animal, or plant lives or operates.",
      defVn: "Môi trường",
      exampleEn: "We must take concrete steps to protect our natural environment.",
      exampleVn: "Chúng ta phải thực hiện các bước cụ thể để bảo vệ môi trường tự nhiên của chúng ta.",
      cefrLevel: "B1",
      topic: "Environment",
      synonyms: "surroundings, habitat, ecosystem",
      collocations: "protect the environment, working environment, environmental protection",
    },
    {
      word: "confidence",
      phonetic: "/ˈkɑːnfɪdəns/",
      pos: "noun",
      defEn: "A feeling of self-assurance arising from one's appreciation of one's own abilities or qualities.",
      defVn: "Sự tự tin",
      exampleEn: "Practicing public speaking helped build her confidence.",
      exampleVn: "Luyện tập nói trước đám đông đã giúp xây dựng sự tự tin của cô ấy.",
      cefrLevel: "B1",
      topic: "Psychology",
      synonyms: "self-assurance, conviction, poise",
      collocations: "boost confidence, lack confidence, have confidence in",
    },
    {
      word: "achieve",
      phonetic: "/əˈtʃiːv/",
      pos: "verb",
      defEn: "Successfully bring about or reach a desired objective by effort, skill, or courage.",
      defVn: "Đạt được, giành được",
      exampleEn: "With consistent daily practice, you will achieve your target CEFR score.",
      exampleVn: "Với việc luyện tập hàng ngày đều đặn, bạn sẽ đạt được điểm CEFR mục tiêu của mình.",
      cefrLevel: "B1",
      topic: "Success",
      synonyms: "attain, accomplish, realize",
      collocations: "achieve a goal, achieve success, achieve results",
    },

    // B2
    {
      word: "ubiquitous",
      phonetic: "/juːˈbɪkwɪtəs/",
      pos: "adjective",
      defEn: "Present, appearing, or found everywhere.",
      defVn: "Phổ biến ở khắp mọi nơi, có mặt khắp nơi",
      exampleEn: "Smartphones have become ubiquitous in modern urban society.",
      exampleVn: "Điện thoại thông minh đã trở nên phổ biến ở khắp mọi nơi trong xã hội đô thị hiện đại.",
      cefrLevel: "B2",
      topic: "Technology & Society",
      synonyms: "omnipresent, pervasive, everywhere",
      collocations: "become ubiquitous, ubiquitous presence",
    },
    {
      word: "scrutinize",
      phonetic: "/ˈskruːtənaɪz/",
      pos: "verb",
      defEn: "Examine or inspect closely and thoroughly.",
      defVn: "Xem xét kỹ lưỡng, khảo sát cẩn thận",
      exampleEn: "The auditor scrutinized every invoice for potential discrepancies.",
      exampleVn: "Kiểm toán viên đã xem xét kỹ lưỡng từng hóa đơn để tìm ra các điểm sai lệch tiềm ẩn.",
      cefrLevel: "B2",
      topic: "Academic & Business",
      synonyms: "inspect, examine, analyze, audit",
      collocations: "closely scrutinize, carefully scrutinize",
    },
    {
      word: "pragmatic",
      phonetic: "/præɡˈmætɪk/",
      pos: "adjective",
      defEn: "Dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.",
      defVn: "Thực tế, thực dụng (theo hướng tích cực)",
      exampleEn: "We need a pragmatic approach to resolve the budget deficit.",
      exampleVn: "Chúng ta cần một cách tiếp cận thực tế để giải quyết thâm hụt ngân sách.",
      cefrLevel: "B2",
      topic: "Philosophy & Leadership",
      synonyms: "practical, sensible, matter-of-fact",
      collocations: "pragmatic approach, pragmatic solution, pragmatic view",
    },
    {
      word: "resilience",
      phonetic: "/rɪˈzɪliəns/",
      pos: "noun",
      defEn: "The capacity to recover quickly from difficulties; toughness.",
      defVn: "Khả năng phục hồi, tính kiên cường",
      exampleEn: "The community demonstrated extraordinary resilience in the wake of the natural disaster.",
      exampleVn: "Cộng đồng đã thể hiện sự kiên cường phi thường sau thảm họa thiên nhiên.",
      cefrLevel: "B2",
      topic: "Psychology & Society",
      synonyms: "toughness, endurance, fortitude",
      collocations: "build resilience, demonstrate resilience, psychological resilience",
    },
  ];

  for (const v of vocabWords) {
    const createdWord = await prisma.vocabularyWord.upsert({
      where: { word: v.word },
      update: v,
      create: v,
    });

    // Also link initial words to default student's UserVocabulary with spaced repetition status
    await prisma.userVocabulary.upsert({
      where: {
        userId_wordId: {
          userId: user.id,
          wordId: createdWord.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        wordId: createdWord.id,
        status: v.cefrLevel === "A1" ? "familiar" : "learning",
        intervalDays: v.cefrLevel === "A1" ? 3 : 1,
        easeFactor: 2.5,
        repetitions: v.cefrLevel === "A1" ? 2 : 1,
        nextReviewDate: new Date(),
        timesCorrect: 2,
        timesIncorrect: 0,
      },
    });
  }

  // 5. Pre-built Tests
  const placementTest = await prisma.test.create({
    data: {
      title: "CEFR Comprehensive Diagnostic Placement Test (A1–B2)",
      description: "Evaluate your overall English competence across grammar, vocabulary, and reading comprehension to estimate your current CEFR tier.",
      category: "placement",
      cefrLevel: "mixed",
      timeLimitMinutes: 20,
      passingScore: 70,
      isCustom: false,
      questions: {
        create: [
          {
            type: "mcq",
            question: "Choose the correct sentence: [A1]",
            contextText: null,
            optionsJson: JSON.stringify([
              "She don't like milk.",
              "She doesn't likes milk.",
              "She doesn't like milk.",
              "She no like milk.",
            ]),
            correctAnswer: "She doesn't like milk.",
            explanation: "In Present Simple negative, 3rd person singular takes 'doesn't' + base verb: 'doesn't like'.",
            topic: "Present Simple",
            orderIndex: 1,
          },
          {
            type: "mcq",
            question: "Yesterday, we ___ a strange noise outside the window. [A2]",
            contextText: null,
            optionsJson: JSON.stringify(["hear", "heared", "heard", "hearing"]),
            correctAnswer: "heard",
            explanation: "'Hear' is an irregular verb with past tense 'heard'.",
            topic: "Past Simple",
            orderIndex: 2,
          },
          {
            type: "mcq",
            question: "They have lived in this neighborhood ___ ten years. [B1]",
            contextText: null,
            optionsJson: JSON.stringify(["since", "for", "during", "ago"]),
            correctAnswer: "for",
            explanation: "'For' is used with a duration of time (ten years), whereas 'since' marks a starting point.",
            topic: "Present Perfect",
            orderIndex: 3,
          },
          {
            type: "mcq",
            question: "If I ___ you, I would take that job offer immediately. [B1]",
            contextText: null,
            optionsJson: JSON.stringify(["am", "was", "were", "would be"]),
            correctAnswer: "were",
            explanation: "Second conditional subjunctive convention prefers 'were' for all pronouns: 'If I were you'.",
            topic: "Conditionals",
            orderIndex: 4,
          },
          {
            type: "mcq",
            question: "Had the directors examined the balance sheet closely, they ___ the deficit. [B2]",
            contextText: null,
            optionsJson: JSON.stringify([
              "will discover",
              "would have discovered",
              "had discovered",
              "discovered",
            ]),
            correctAnswer: "would have discovered",
            explanation: "Inverted Third Conditional: 'Had they examined...' corresponds to 'would have discovered'.",
            topic: "Mixed Conditionals & Inversion",
            orderIndex: 5,
          },
          {
            type: "fill_blank",
            question: "Type the missing word: The community demonstrated extraordinary ___ (toughness/resilience) after the storm. [B2]",
            contextText: null,
            optionsJson: null,
            correctAnswer: "resilience",
            explanation: "'Resilience' describes the capacity to recover quickly from hardship.",
            topic: "Advanced Vocabulary",
            orderIndex: 6,
          },
        ],
      },
    },
  });

  const a1Assessment = await prisma.test.create({
    data: {
      title: "Level A1 Assessment: Core Grammar & Daily Life",
      description: "Test your mastery of A1 foundations: to be, subject pronouns, present simple, and daily vocabulary.",
      category: "level_assessment",
      cefrLevel: "A1",
      timeLimitMinutes: 15,
      passingScore: 75,
      isCustom: false,
      questions: {
        create: [
          {
            type: "mcq",
            question: "Where ___ you from?",
            contextText: null,
            optionsJson: JSON.stringify(["is", "are", "am", "be"]),
            correctAnswer: "are",
            explanation: "'You' pairs with 'are'.",
            topic: "Verb To Be",
            orderIndex: 1,
          },
          {
            type: "fill_blank",
            question: "Complete the sentence: 'My mother is a teacher. ___ teaches English.'",
            contextText: null,
            optionsJson: null,
            correctAnswer: "She",
            explanation: "'She' replaces singular female subject 'My mother'.",
            topic: "Pronouns",
            orderIndex: 2,
          },
          {
            type: "mcq",
            question: "Which sentence is correct?",
            contextText: null,
            optionsJson: JSON.stringify([
              "He go to work by bus.",
              "He goes to work by bus.",
              "He going to work by bus.",
              "He is go to work by bus.",
            ]),
            correctAnswer: "He goes to work by bus.",
            explanation: "Verbs ending in -o (go) take -es with 3rd person singular: 'goes'.",
            topic: "Present Simple",
            orderIndex: 3,
          },
        ],
      },
    },
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
