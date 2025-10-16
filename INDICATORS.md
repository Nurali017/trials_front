Новая с работами показателами 

Реализована автоматизация работы с показателями испытаний на всех этапах жизненного цикла:

1. **При создании Trial** - автоматическое назначение показателей по культуре
2. **При создании TrialParticipant** - автоматическое создание основных показателей
3. **При отправке в лабораторию** - автоматическое создание качественных показателей
4. **Улучшен bulk_entry** - корректная работа с существующими записями

---

## 🔄 Жизненный цикл испытания

### 1️⃣ Создание испытания (Trial)

**Что происходит:**
```python
POST /api/v1/trials/
{
  "region": 1,
  "culture": 2,  // Пшеница
  "start_date": "2025-04-15",
  "participants": [...]
}
```

**Автоматически:**
- ✅ Загружаются ВСЕ показатели для культуры (основные + качественные)
- ✅ Привязываются к `trial.indicators` (ManyToMany)
- ✅ Включаются универсальные показатели (`is_universal=True`)

**Код:** `trials_app/serializers.py` строки 439-454

---

### 2️⃣ Добавление участников (TrialParticipant)

**Что происходит:**
```python
POST /api/v1/trial-participants/add-participants/
{
  "trial": 10,
  "participants": [
    {
      "sort_record": 5,
      "participant_number": 1,
      "statistical_group": 0  // Стандарт
    },
    {
      "sort_record": 8,
      "participant_number": 2,
      "statistical_group": 1  // Испытываемый
    }
  ]
}
```

**Автоматически для КАЖДОГО участника:**
- ✅ Создаются пустые `TrialResult` для **ОСНОВНЫХ** показателей (`is_quality=False`)
- ✅ Примеры: урожайность, высота растений, устойчивость к полеганию
- ✅ Поля `value`, `plot_1-4`, `text_value` = `null` (заполнит сортопыт)

**Функция:** `create_basic_trial_results()` в `serializers.py` строки 13-50

**Используется в:**
- `serializers.py` строка 567 (при создании через API)
- `views.py` строка 1130 (при добавлении участников)

---

### 3️⃣ Работа сортопыта (заполнение данных)

**Сортопыт заполняет основные показатели:**
```python
POST /api/v1/trial-results/bulk-entry/
{
  "participant": 5,
  "measurement_date": "2025-09-15",
  "data": [
    {
      "indicator": 1,  // Урожайность
      "plots": [45.2, 46.8, 44.5, 45.9]  // По делянкам
    },
    {
      "indicator": 2,  // Высота растений
      "value": 95.5  // Среднее значение
    },
    {
      "indicator": 3,  // Устойчивость к полеганию
      "value": 5,
      "text_value": "Высокая"
    }
  ]
}
```

**Что происходит:**
- ✅ Обновляются существующие `TrialResult` (созданные автоматически)
- ✅ Можно оставить некоторые показатели пустыми
- ✅ Поддерживаются делянки (`plots`) или итоговое значение (`value`)

**Код:** `views.py` строки 1229-1263

---

### 4️⃣ Отправка в лабораторию

**Что происходит:**
```python
POST /api/v1/trials/{id}/mark-sent-to-lab/
{
  "laboratory_code": "LAB-2025-001-ALM",
  "sample_weight_kg": 2.5,
  "sent_date": "2025-10-01",
  "sample_source": "Образец из делянки №2"
}
```

**Автоматически для ВСЕХ участников:**
- ✅ Создаются пустые `TrialResult` для **КАЧЕСТВЕННЫХ** показателей (`is_quality=True`)
- ✅ Примеры: белок, клейковина, натура зерна, крахмалистость
- ✅ Статус испытания → `lab_sample_sent`

**Функция:** `create_quality_trial_results()` в `serializers.py` строки 53-92

**Используется в:** `views.py` строка 916

---

### 5️⃣ Работа лаборатории

**Лаборатория заполняет качественные показатели:**
```python
POST /api/v1/trial-results/bulk-entry/
{
  "participant": 5,
  "measurement_date": "2025-10-10",
  "data": [
    {
      "indicator": 10,  // Белок
      "value": 14.2
    },
    {
      "indicator": 11,  // Клейковина
      "value": 28.5
    },
    {
      "indicator": 12,  // Натура зерна
      "value": 785
    }
  ]
}
```

**Что происходит:**
- ✅ Обновляются существующие `TrialResult` (созданные автоматически)
- ✅ Можно оставить некоторые показатели пустыми
- ✅ После заполнения статус → `lab_completed`

---

## 📊 Разделение показателей

### Основные показатели (Сортопыт)
**Поле:** `is_quality = False`

**Примеры:**
- Урожайность (ц/га)
- Высота растений (см)
- Устойчивость к полеганию (баллы)
- Устойчивость к болезням (баллы)
- Дата всходов, цветения, созревания
- Масса 1000 зерен (г)

**Когда создаются:** При создании `TrialParticipant`

**Кто заполняет:** Сортопыт в поле

---

### Качественные показатели (Лаборатория)
**Поле:** `is_quality = True`

**Примеры:**
- Белок (%)
- Клейковина (%)
- Натура зерна (г/л)
- Крахмалистость (%)
- Содержание масла (%)
- Витамин С (мг)

**Когда создаются:** При отправке в лабораторию (`mark_sent_to_lab`)

**Кто заполняет:** Лаборатория

---

## 🔧 Технические детали

### Вспомогательные функции

#### `create_basic_trial_results(participant, created_by)`
```python
# Где: trials_app/serializers.py строки 13-50
# Создает пустые TrialResult для основных показателей
# Параметры:
#   - participant: TrialParticipant instance
#   - created_by: User who creates the results
# Возвращает: list созданных TrialResult
```

#### `create_quality_trial_results(trial, created_by)`
```python
# Где: trials_app/serializers.py строки 53-92
# Создает пустые TrialResult для качественных показателей
# Параметры:
#   - trial: Trial instance
#   - created_by: User who creates the results
# Возвращает: list созданных TrialResult
```

---

### Автоматическое назначение indicators по культуре

**Логика:** `trials_app/serializers.py` строки 439-454

```python
# Если indicators не указаны явно, загружаются автоматически
if not indicators and trial.culture:
    auto_indicators = Indicator.objects.filter(
        Q(cultures=trial.culture) | Q(is_universal=True),
        is_deleted=False
    ).distinct()
    
    trial.indicators.set(auto_indicators)
```

---

### Улучшения bulk_entry

**Что изменилось:** `trials_app/views.py` строки 1229-1263

```python
# Корректная работа с существующими записями
result, created = TrialResult.objects.get_or_create(
    participant=participant,
    indicator_id=indicator_id,
    defaults={
        'trial': participant.trial,
        'sort_record': participant.sort_record,
        'measurement_date': measurement_date,
        'created_by': request.user
    }
)

# Поддержка делянок ИЛИ итогового значения
if 'plots' in item:
    result.plot_1 = item['plots'][0]
    result.plot_2 = item['plots'][1]
    result.plot_3 = item['plots'][2]
    result.plot_4 = item['plots'][3]
elif 'value' in item:
    result.value = item['value']
    # Очищаем делянки если передается итоговое значение
    result.plot_1 = None
    result.plot_2 = None
    result.plot_3 = None
    result.plot_4 = None
```

---

## 📝 Примеры использования

### Пример 1: Создание испытания пшеницы

```python
# 1. Создать испытание
POST /api/v1/trials/
{
  "region": 5,
  "culture": 2,  // Пшеница
  "start_date": "2025-04-15",
  "trial_type": 1,
  "participants": [
    {
      "sort_record": 10,  // Акмола 2 (стандарт)
      "participant_number": 1,
      "statistical_group": 0
    },
    {
      "sort_record": 15,  // Новинка (испытываемый)
      "participant_number": 2,
      "statistical_group": 1
    }
  ]
}

# Результат:
# ✅ Trial создано
# ✅ Indicators автоматически загружены для пшеницы (10 показателей)
# ✅ 2 участника созданы
# ✅ 20 пустых TrialResult созданы (2 участника × 10 основных показателей)
```

---

### Пример 2: Заполнение данных сортопытом

```python
POST /api/v1/trial-results/bulk-entry/
{
  "participant": 50,  // Акмола 2
  "measurement_date": "2025-09-20",
  "data": [
    {
      "indicator": 1,  // Урожайность
      "plots": [42.5, 43.8, 41.9, 43.2]
    },
    {
      "indicator": 2,  // Высота растений
      "value": 92
    },
    {
      "indicator": 3,  // Устойчивость к полеганию
      "value": 5
    }
    // Остальные показатели остаются пустыми
  ]
}

# Результат:
# ✅ 3 показателя обновлены
# ✅ 7 показателей остались пустыми (можно заполнить позже)
```

---

### Пример 3: Отправка в лабораторию

```python
POST /api/v1/trials/10/mark-sent-to-lab/
{
  "laboratory_code": "LAB-2025-042-ALM",
  "sample_weight_kg": 2.0,
  "sent_date": "2025-10-01"
}

# Результат:
# ✅ Статус → lab_sample_sent
# ✅ 6 пустых TrialResult созданы (2 участника × 3 качественных показателя)
# ✅ Лаборатория может начинать работу
```

---

### Пример 4: Заполнение данных лабораторией

```python
POST /api/v1/trial-results/bulk-entry/
{
  "participant": 50,  // Акмола 2
  "measurement_date": "2025-10-08",
  "data": [
    {
      "indicator": 10,  // Белок
      "value": 13.8
    },
    {
      "indicator": 11,  // Клейковина
      "value": 26.5
    },
    {
      "indicator": 12,  // Натура зерна
      "value": 780
    }
  ]
}

# Результат:
# ✅ Качественные показатели заполнены
# ✅ Можно переводить в статус lab_completed
```

---

## 🎯 Преимущества

### Для сортопытов:
- ✅ Не нужно вручную создавать показатели
- ✅ Сразу видно какие данные нужно собрать
- ✅ Можно заполнять постепенно (некоторые оставить пустыми)

### Для лаборатории:
- ✅ Готовая структура для заполнения
- ✅ Четкое понимание каких анализов ждут
- ✅ Быстрое внесение результатов

### Для системы:
- ✅ Единая структура данных
- ✅ Легко отслеживать прогресс (заполнено/не заполнено)
- ✅ Автоматическая валидация полноты данных

---

## 📚 API Reference

### Получить показатели для культуры

```http
GET /api/v1/indicators/?culture_id=2
GET /api/v1/indicators/?culture_id=2&is_quality=false  # Только основные
GET /api/v1/indicators/?culture_id=2&is_quality=true   # Только качественные
```

### Получить результаты участника

```http
GET /api/v1/trial-results/?participant=50
```

### Массовое внесение результатов

```http
POST /api/v1/trial-results/bulk-entry/
{
  "participant": 50,
  "measurement_date": "2025-09-20",
  "data": [...]
}
```

### Отметить отправку в лабораторию

```http
POST /api/v1/trials/{id}/mark-sent-to-lab/
{
  "laboratory_code": "LAB-2025-042-ALM",
  "sample_weight_kg": 2.0,
  "sent_date": "2025-10-01"
}
```

---

## 🔍 Диагностика

### Проверить какие показатели назначены испытанию

```python
trial = Trial.objects.get(id=10)
print("Всего показателей:", trial.indicators.count())
print("Основные:", trial.indicators.filter(is_quality=False).count())
print("Качественные:", trial.indicators.filter(is_quality=True).count())
```

### Проверить сколько результатов создано

```python
participant = TrialParticipant.objects.get(id=50)
results = participant.results.filter(is_deleted=False)
print("Всего результатов:", results.count())
print("Заполнено:", results.exclude(value__isnull=True).count())
print("Пустых:", results.filter(value__isnull=True).count())
```



