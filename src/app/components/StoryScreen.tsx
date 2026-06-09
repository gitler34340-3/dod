import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Play, Pause, X } from 'lucide-react';
interface Story {
  id: string;
  category: 'adaptation' | 'kitchen' | 'service' | 'teamwork';
  title: string;
  subtitle: string;
  content: string;
  characterEmoji: string;
  characterName?: string;
  backgroundGradient: string;
}

type StoryTab = 'adaptation' | 'kitchen' | 'service' | 'teamwork';

export function StoryScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<StoryTab>('adaptation');
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const holdPauseRef = useRef(false);
  const tabOrder: StoryTab[] = ['adaptation', 'kitchen', 'service', 'teamwork'];

  const stories: Story[] = [
    {
      id: '1',
      category: 'adaptation',
      title: 'Добро пожаловать, Ковбой!',
      subtitle: 'Артур Морган. Начало пути',
      content: 'Приветствую тебя в Dodo Pizza. Я Артур Морган, и я помогу тебе освоиться. Здесь важны дисциплина, уважение к команде и уверенность в каждом действии. Готов начать путь в нашей команде?',
      characterEmoji: '🤠',
      characterName: 'Arthur Morgan',
      backgroundGradient: 'from-[#d32f2f] to-[#ff6f00]'
    },
    {
      id: '2',
      category: 'adaptation',
      title: 'Мудрость и Терпение',
      subtitle: 'Хозия Мэтьюз. Сила знаний',
      content: 'Здравствуй, молодой друг. Я Hosea Matthews, советник нашей команды. Помни: спешка - враг качества. Слушай, учись, задавай вопросы. Мудрость приходит с опытом, и я помогу тебе избежать ошибок, которые делают новички.',
      characterEmoji: '📚',
      characterName: 'Hosea Matthews',
      backgroundGradient: 'from-[#4caf50] to-[#ffa000]'
    },
    {
      id: '3',
      category: 'adaptation',
      title: 'Первые правила смены',
      subtitle: 'Артур Морган. Дисциплина и порядок',
      content: 'Приходи заранее, проверяй форму, следи за чистотой рабочего места и не бойся уточнять задачу у старшего смены. Хорошее начало дня экономит силы всей команде.',
      characterEmoji: '🕒',
      characterName: 'Arthur Morgan',
      backgroundGradient: 'from-[#4caf50] to-[#d32f2f]'
    },
    {
      id: '4',
      category: 'kitchen',
      title: 'Мастерство и Точность',
      subtitle: 'Джон Марстон. Основы работы',
      content: 'Я Джон Марстон. Каждая пицца требует точности и аккуратности. Правильно раскатывай тесто, равномерно распределяй соус и следи за балансом ингредиентов. Именно повторение и внимание к деталям делают из новичка мастера.',
      characterEmoji: '🎯',
      characterName: 'John Marston',
      backgroundGradient: 'from-[#ff6f00] to-[#4caf50]'
    },
    {
      id: '5',
      category: 'kitchen',
      title: 'Скорость без потери качества',
      subtitle: 'Чарльз Смит. Работа на линии',
      content: 'Быстрая работа не должна вредить качеству. Собирай заказы по шагам, проверяй ингредиенты и не пропускай контроль перед отправкой в печь. Стабильность важнее суеты.',
      characterEmoji: '🍕',
      characterName: 'Charles Smith',
      backgroundGradient: 'from-[#ff6f00] to-[#ffa000]'
    },
    {
      id: '6',
      category: 'kitchen',
      title: 'Чистота кухни',
      subtitle: 'Хозия Мэтьюз. Основа безопасности',
      content: 'Порядок на кухне защищает и команду, и гостей. После каждого этапа возвращай инвентарь на место, следи за маркировкой и не допускай беспорядка у станции.',
      characterEmoji: '🧼',
      characterName: 'Hosea Matthews',
      backgroundGradient: 'from-[#4caf50] to-[#ff6f00]'
    },
    {
      id: '7',
      category: 'service',
      title: 'Общение с гостем',
      subtitle: 'Сэди Адлер. Спокойствие и уважение',
      content: 'Слушай клиента внимательно, говори коротко и по делу, не спорь и всегда предлагай решение. Даже в сложном разговоре спокойный тон помогает удержать доверие.',
      characterEmoji: '🗣️',
      characterName: 'Sadie Adler',
      backgroundGradient: 'from-[#9c27b0] to-[#ff6f00]'
    },
    {
      id: '8',
      category: 'service',
      title: 'Сбор заказа',
      subtitle: 'Джон Марстон. Проверка перед выдачей',
      content: 'Перед выдачей заказа проверь состав, количество позиций, напитки и дополнительные соусы. Одна лишняя проверка лучше, чем повторный контакт с недовольным гостем.',
      characterEmoji: '📦',
      characterName: 'John Marston',
      backgroundGradient: 'from-[#ffa000] to-[#d32f2f]'
    },
    {
      id: '9',
      category: 'service',
      title: 'Работа с жалобами',
      subtitle: 'Датч ван дер Линде. Возвращаем доверие',
      content: 'Если возникает жалоба, сначала выслушай, затем подтверди проблему и только потом предложи решение. Главное не защищаться, а вернуть клиенту уверенность, что его услышали.',
      characterEmoji: '🤝',
      characterName: 'Dutch van der Linde',
      backgroundGradient: 'from-[#d32f2f] to-[#9c27b0]'
    },
    {
      id: '10',
      category: 'teamwork',
      title: 'Работа в Команде',
      subtitle: 'Датч ван дер Линде. Сила единства',
      content: 'У меня есть план! Я Dutch, лидер этой банды. Запомни: на Диком Западе выживают только те, кто умеет работать в команде. Поддерживай своих коллег, помогай новичкам, и вместе мы достигнем величия!',
      characterEmoji: '👑',
      characterName: 'Dutch van der Linde',
      backgroundGradient: 'from-[#ffa000] to-[#9c27b0]'
    },
    {
      id: '11',
      category: 'teamwork',
      title: 'Сила и Решительность',
      subtitle: 'Сэди Адлер. Преодоление трудностей',
      content: 'Слушай сюда! Я Sadie Adler, и я не привыкла сдаваться. Будут тяжелые смены, сложные заказы, трудные клиенты - но ты справишься! Проявляй характер, работай с душой, и никогда не останавливайся перед трудностями!',
      characterEmoji: '💪',
      characterName: 'Sadie Adler',
      backgroundGradient: 'from-[#9c27b0] to-[#d32f2f]'
    },
    {
      id: '12',
      category: 'teamwork',
      title: 'Передача смены',
      subtitle: 'Чарльз Смит. Завершение без потерь',
      content: 'Передавая смену, оставь понятную картину: что уже сделано, где есть риски и на что обратить внимание дальше. Чёткая передача уменьшает ошибки и экономит время всей точки.',
      characterEmoji: '🔄',
      characterName: 'Charles Smith',
      backgroundGradient: 'from-[#d32f2f] to-[#ffa000]'
    },
  ];

  const tabs = useMemo(
    () => [
      { id: 'adaptation' as const, label: 'Адаптация' },
      { id: 'kitchen' as const, label: 'Кухня' },
      { id: 'service' as const, label: 'Сервис' },
      { id: 'teamwork' as const, label: 'Команда' },
    ],
    [],
  );

  const allStories = useMemo(
    () => stories.filter((story) => story.category === activeTab).slice(0, 3),
    [activeTab],
  );

  const currentStory = allStories[currentStoryIndex];

  useEffect(() => {
    setCurrentStoryIndex(0);
    setProgress(0);
    setIsPaused(false);
  }, [activeTab]);

  useEffect(() => {
    if (isPaused || !currentStory) return;

    const interval = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2;
        if (next >= 100) {
          window.clearInterval(interval);
          if (currentStoryIndex < allStories.length - 1) {
            setCurrentStoryIndex((value) => value + 1);
            return 0;
          }
          const activeTabIndex = tabOrder.indexOf(activeTab);
          const nextTab = tabOrder[activeTabIndex + 1];
          if (nextTab) {
            setActiveTab(nextTab);
            return 0;
          }
          handleComplete();
          return 100;
        }
        return next;
      });
    }, 120);

    return () => window.clearInterval(interval);
  }, [activeTab, allStories.length, currentStory, currentStoryIndex, isPaused]);

  const handleNext = () => {
    if (currentStoryIndex < allStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    }
  };

  const handleComplete = () => {
    // Mark training as completed in localStorage
    localStorage.setItem('training_completed', 'true');
    navigate('/home');
  };

  const pauseStories = () => {
    holdPauseRef.current = true;
    setIsPaused(true);
  };

  const resumeStories = () => {
    if (!holdPauseRef.current) return;
    holdPauseRef.current = false;
    setIsPaused(false);
  };

  return (
    <div className="min-h-screen w-full dust-effect relative overflow-hidden bg-gradient-to-b from-[#1a1a1a] via-[#2c1810] to-[#1a1a1a]">
      {/* Close Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/home')}
        className="absolute top-4 right-4 z-30 p-2 rounded-full glass"
      >
        <X className="w-6 h-6 text-white" />
      </motion.button>

      {/* Progress Indicators */}
      <div className="absolute top-4 left-4 right-4 z-20 flex gap-2">
        {allStories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: index < currentStoryIndex ? '100%' : index === currentStoryIndex ? `${progress}%` : '0%'
              }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-[#d32f2f] to-[#ff6f00]"
            />
          </div>
        ))}
      </div>

      <div className="absolute top-11 left-3 right-14 z-20 flex gap-2 overflow-x-auto no-scrollbar pr-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="rounded-full px-3 py-2 text-xs sm:text-sm whitespace-nowrap shrink-0"
            style={{
              backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              border: activeTab === tab.id ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.15)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Story Content */}
      <AnimatePresence mode="wait">
        {currentStory ? (
        <motion.div
          key={currentStoryIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.4 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x <= -60) handleNext();
            if (info.offset.x >= 60) handlePrevious();
          }}
          onPointerDown={pauseStories}
          onPointerUp={resumeStories}
          onPointerCancel={resumeStories}
          onPointerLeave={resumeStories}
          className="relative z-10 flex flex-col items-center justify-center min-h-screen px-3 sm:px-4 pt-24 pb-28"
        >
          {/* Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${currentStory.backgroundGradient} opacity-20`} />

          {/* Character */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative z-10 mb-6"
          >
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#d32f2f] to-[#ff6f00] p-1">
              <div className="w-full h-full rounded-full bg-[#2c1810] flex items-center justify-center overflow-hidden">
                {currentStory.characterName && !failedImages[currentStory.id] ? (
                  <img 
                    src={`/characters/${currentStory.characterName.toLowerCase().replace(/\s+/g, '-')}.png`}
                    alt={currentStory.characterName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      setFailedImages((prev) => ({ ...prev, [currentStory.id]: true }));
                    }}
                  />
                ) : (
                  <span className="text-5xl sm:text-7xl">{currentStory.characterEmoji}</span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-2xl sm:text-4xl md:text-5xl font-bold text-center mb-2"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <span className="bg-gradient-to-r from-[#d32f2f] to-[#ff6f00] bg-clip-text text-transparent">
              {currentStory.title}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-[#ffa000] text-sm sm:text-lg mb-5 sm:mb-8 text-center"
          >
            {currentStory.subtitle}
          </motion.p>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="glass rounded-2xl p-4 sm:p-8 max-w-2xl card-shadow-lg"
          >
            <p className="text-white text-sm sm:text-lg leading-relaxed text-center">
              {currentStory.content}
            </p>
          </motion.div>

          {/* Navigation Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-6 sm:mt-12 fixed bottom-7 left-0 right-0 z-30 flex items-center justify-center gap-4 px-4 sm:static"
          >
            {/* Previous Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePrevious}
              disabled={currentStoryIndex === 0}
                className={`p-3 sm:p-4 rounded-full glass ${
                currentStoryIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </motion.button>

            {/* Pause/Play Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsPaused(!isPaused)}
              className="p-3 sm:p-4 rounded-full bg-gradient-to-r from-[#d32f2f] to-[#ff6f00]"
            >
              {isPaused ? (
                <Play className="w-6 h-6 text-white" />
              ) : (
                <Pause className="w-6 h-6 text-white" />
              )}
            </motion.button>

            {/* Next Button */}
            {currentStoryIndex < allStories.length - 1 ? (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleNext}
                className="p-3 sm:p-4 rounded-full glass"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleComplete}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-gradient-to-r from-[#d32f2f] to-[#ff6f00] font-semibold text-white"
              >
                Завершить
              </motion.button>
            )}
          </motion.div>

          {/* Progress Counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-4 sm:mt-8 text-[#d7ccc8] text-xs sm:text-sm"
          >
            {currentStoryIndex + 1} / {allStories.length}
          </motion.div>
        </motion.div>
        ) : (
          <motion.div
            key="empty-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20"
          >
            <div className="glass rounded-2xl p-8 text-center text-white">
              В этой вкладке пока нет историй.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe Hint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-1 sm:bottom-8 left-0 right-0 z-20 text-center text-[#d7ccc8] text-xs sm:text-sm"
      >
        Свайпайте влево/вправо для навигации
      </motion.div>
    </div>
  );
}