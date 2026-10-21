import os
import django
from datetime import timedelta
from django.utils import timezone
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'delo_ryadom.settings')
django.setup()

from django.contrib.auth import get_user_model
from jobs.models import Category, Job, JobApplication, Review, JobStage, GuaranteeClaim
from accounts.models import ContractorProfile
from chat.models import ChatRoom, Message

User = get_user_model()

# Synthetic fixtures for an explicitly requested local demo.
DEMO_PASSWORD = os.environ.get('DEMO_PASSWORD')
if not DEMO_PASSWORD:
    raise SystemExit('Set DEMO_PASSWORD explicitly to seed a local demo database.')


def create_users():
    users_data = [
        {
            'username': 'admin',
            'email': 'demo1@example.com',
            'password': DEMO_PASSWORD,
            'role': 'customer',
            'first_name': 'Администратор',
            'last_name': 'Системы',
            'is_superuser': True,
        },
        {
            'username': 'ivan_santehnik',
            'email': 'demo2@example.com',
            'password': DEMO_PASSWORD,
            'role': 'contractor',
            'first_name': 'Иван',
            'last_name': 'Петров',
            'phone': '',
            'profile': {
                'bio': 'Профессиональный сантехник с 8-летним опытом. Установка, ремонт и обслуживание систем водоснабжения и канализации. Работаю быстро, качественно, с гарантией.',
                'experience_years': 8,
                'skills': 'Установка сантехники, замена труб, устранение засоров, монтаж водонагревателей, ремонт смесителей',
                'hourly_rate': Decimal('1500.00'),
                'rating': Decimal('4.85'),
                'completed_jobs': 127,
            }
        },
        {
            'username': 'sergey_electro',
            'email': 'demo3@example.com',
            'password': DEMO_PASSWORD,
            'role': 'contractor',
            'first_name': 'Сергей',
            'last_name': 'Васильев',
            'phone': '',
            'profile': {
                'bio': 'Электрик с допуском до 1000В. Выполняю все виды электромонтажных работ. Подключение электроприборов, замена проводки, установка счетчиков.',
                'experience_years': 10,
                'skills': 'Замена проводки, установка розеток и выключателей, подключение люстр, ремонт электрощитов, диагностика неисправностей',
                'hourly_rate': Decimal('1800.00'),
                'rating': Decimal('4.92'),
                'completed_jobs': 213,
            }
        },
        {
            'username': 'olga_cleaner',
            'email': 'demo4@example.com',
            'password': DEMO_PASSWORD,
            'role': 'contractor',
            'first_name': 'Ольга',
            'last_name': 'Смирнова',
            'phone': '',
            'profile': {
                'bio': 'Клининговые услуги любой сложности. Генеральная уборка, уборка после ремонта, поддерживающая уборка. Своя техника и моющие средства.',
                'experience_years': 5,
                'skills': 'Генеральная уборка, уборка после ремонта, мытье окон, химчистка мебели, уборка офисов',
                'hourly_rate': Decimal('800.00'),
                'rating': Decimal('4.78'),
                'completed_jobs': 89,
            }
        },
        {
            'username': 'dmitry_builder',
            'email': 'demo5@example.com',
            'password': DEMO_PASSWORD,
            'role': 'contractor',
            'first_name': 'Дмитрий',
            'last_name': 'Козлов',
            'phone': '',
            'profile': {
                'bio': 'Мастер универсал. Ремонт квартир под ключ, отделочные работы, установка дверей и окон. Работаю с бригадой для крупных объектов.',
                'experience_years': 12,
                'skills': 'Штукатурка, шпаклевка, поклейка обоев, укладка плитки, установка дверей, монтаж гипсокартона',
                'hourly_rate': Decimal('2000.00'),
                'rating': Decimal('4.95'),
                'completed_jobs': 156,
            }
        },
        {
            'username': 'alex_it',
            'email': 'demo6@example.com',
            'password': DEMO_PASSWORD,
            'role': 'contractor',
            'first_name': 'Александр',
            'last_name': 'Новиков',
            'phone': '',
            'profile': {
                'bio': 'IT-специалист. Настройка компьютеров и ноутбуков, удаление вирусов, установка ПО, настройка сетей, восстановление данных.',
                'experience_years': 7,
                'skills': 'Ремонт ПК, настройка Windows/Linux, удаление вирусов, настройка Wi-Fi, восстановление данных, сборка компьютеров',
                'hourly_rate': Decimal('1200.00'),
                'rating': Decimal('4.88'),
                'completed_jobs': 98,
            }
        },
        {
            'username': 'maria_customer',
            'email': 'demo7@example.com',
            'password': DEMO_PASSWORD,
            'role': 'customer',
            'first_name': 'Мария',
            'last_name': 'Соколова',
            'phone': '',
        },
        {
            'username': 'pavel_customer',
            'email': 'demo8@example.com',
            'password': DEMO_PASSWORD,
            'role': 'customer',
            'first_name': 'Павел',
            'last_name': 'Морозов',
            'phone': '',
        },
        {
            'username': 'elena_customer',
            'email': 'demo9@example.com',
            'password': DEMO_PASSWORD,
            'role': 'customer',
            'first_name': 'Елена',
            'last_name': 'Воронова',
            'phone': '',
        },
    ]

    created_users = {}
    for user_data in users_data:
        profile_data = user_data.pop('profile', None)
        is_superuser = user_data.pop('is_superuser', False)

        if not User.objects.filter(username=user_data['username']).exists():
            if is_superuser:
                user = User.objects.create_superuser(
                    username=user_data['username'],
                    email=user_data['email'],
                    password=user_data['password'],
                    role=user_data['role'],
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name'],
                )
            else:
                password = user_data.pop('password')
                user = User.objects.create_user(password=password, **user_data)

            if profile_data:
                ContractorProfile.objects.create(user=user, **profile_data)

            created_users[user_data['username']] = user
            print(f'✓ Создан: {user_data["username"]}')
        else:
            created_users[user_data['username']] = User.objects.get(username=user_data['username'])

    return created_users


def create_categories():
    categories_data = [
        {'name': 'Ремонт и строительство', 'slug': 'repair',
         'description': 'Отделочные работы, ремонт квартир, строительство'},
        {'name': 'Сантехника', 'slug': 'plumbing',
         'description': 'Установка и ремонт сантехники, водоснабжение, канализация'},
        {'name': 'Электрика', 'slug': 'electrician',
         'description': 'Электромонтажные работы, замена проводки, установка розеток'},
        {'name': 'Грузоперевозки', 'slug': 'transport', 'description': 'Перевозка грузов, переезды, доставка'},
        {'name': 'Уборка', 'slug': 'cleaning', 'description': 'Клининг, уборка квартир и офисов'},
        {'name': 'IT и компьютеры', 'slug': 'it', 'description': 'Ремонт компьютеров, настройка ПО, IT-поддержка'},
    ]

    categories = {}
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(**cat_data)
        categories[cat_data['slug']] = category

    print(f'✓ Создано {len(categories_data)} категорий')
    return categories


def create_jobs(users, categories):
    now = timezone.now()

    jobs_data = [
        {
            'title': 'Замена смесителя на кухне',
            'description': 'Нужно заменить старый смеситель на новый. Смеситель уже куплен, нужна только установка. Кухня в хрущевке, доступ свободный.',
            'customer': users['maria_customer'],
            'category': categories['plumbing'],
            'price': Decimal('1500.00'),
            'latitude': Decimal('55.751244'),
            'longitude': Decimal('37.618423'),
            'address': 'Демонстрационный адрес, Москва',
            'status': 'open',
        },
        {
            'title': 'Установка люстры в зале',
            'description': 'Требуется повесить люстру в зале. Потолок бетонный, высота 2.7м. Люстра на 5 рожков, весит около 8 кг.',
            'customer': users['pavel_customer'],
            'category': categories['electrician'],
            'price': Decimal('2000.00'),
            'latitude': Decimal('55.755814'),
            'longitude': Decimal('37.617635'),
            'address': 'Демонстрационный адрес, Москва',
            'status': 'open',
        },
        {
            'title': 'Генеральная уборка 2-комнатной квартиры',
            'description': 'Нужна генеральная уборка после ремонта. Площадь 55 кв.м. Помыть все окна, полы, убрать строительную пыль.',
            'customer': users['elena_customer'],
            'category': categories['cleaning'],
            'price': Decimal('5000.00'),
            'latitude': Decimal('55.742423'),
            'longitude': Decimal('37.615523'),
            'address': 'Демонстрационный адрес, Москва',
            'status': 'open',
        },
        {
            'title': 'Настройка домашней сети Wi-Fi',
            'description': 'Плохо работает Wi-Fi, нужно настроить роутер и расширить зону покрытия. Квартира 3-комнатная, 80 кв.м.',
            'customer': users['maria_customer'],
            'category': categories['it'],
            'price': Decimal('2500.00'),
            'latitude': Decimal('55.758532'),
            'longitude': Decimal('37.632123'),
            'address': 'Демонстрационный адрес, Москва',
            'status': 'open',
        },

        {
            'title': 'Замена розеток в спальне',
            'description': 'Требуется заменить 4 старые розетки на новые. Розетки куплены, нужна установка.',
            'customer': users['pavel_customer'],
            'category': categories['electrician'],
            'price': Decimal('3000.00'),
            'latitude': Decimal('55.748123'),
            'longitude': Decimal('37.625432'),
            'address': 'Демонстрационный адрес, Москва',
            'status': 'in_progress',
            'contractor': users['sergey_electro'],
        },
        {
            'title': 'Укладка плитки в ванной',
            'description': 'Ванная комната 4 кв.м. Плитка закуплена, стены подготовлены. Нужен опытный плиточник.',
            'customer': users['elena_customer'],
            'category': categories['repair'],
            'price': Decimal('15000.00'),
            'latitude': Decimal('55.752341'),
            'longitude': Decimal('37.619876'),
            'address': 'Демонстрационный адрес, Москва',
            'status': 'in_progress',
            'contractor': users['dmitry_builder'],
        },

        {
            'title': 'Устранение засора в ванной',
            'description': 'Засор в ванной, вода не уходит. Нужно прочистить трубы.',
            'customer': users['maria_customer'],
            'category': categories['plumbing'],
            'price': Decimal('2000.00'),
            'latitude': Decimal('55.745123'),
            'longitude': Decimal('37.612345'),
            'address': 'Демонстрационный адрес, Москва',
            'status': 'completed',
            'contractor': users['ivan_santehnik'],
            'completed_at': now - timedelta(days=4),
        },
        {
            'title': 'Установка стиральной машины',
            'description': 'Подключить новую стиральную машину. Подвод воды есть, нужно подключить и проверить.',
            'customer': users['pavel_customer'],
            'category': categories['plumbing'],
            'price': Decimal('2500.00'),
            'latitude': Decimal('55.756789'),
            'longitude': Decimal('37.628901'),
            'address': 'Демонстрационный адрес, Москва',
            'status': 'completed',
            'contractor': users['ivan_santehnik'],
            'completed_at': now - timedelta(days=6),
        },
        {
            'title': 'Чистка компьютера от вирусов',
            'description': 'Компьютер тормозит, много рекламы. Нужна чистка от вирусов и оптимизация системы.',
            'customer': users['elena_customer'],
            'category': categories['it'],
            'price': Decimal('1500.00'),
            'latitude': Decimal('55.749876'),
            'longitude': Decimal('37.621234'),
            'address': 'Демонстрационный адрес, Москва',
            'status': 'completed',
            'contractor': users['alex_it'],
            'completed_at': now - timedelta(days=9),
        },
        {
            'title': 'Уборка квартиры перед сдачей',
            'description': 'Нужна генеральная уборка 1-комнатной квартиры перед сдачей новым жильцам.',
            'customer': users['maria_customer'],
            'category': categories['cleaning'],
            'price': Decimal('3500.00'),
            'latitude': Decimal('55.753456'),
            'longitude': Decimal('37.615678'),
            'address': 'Демонстрационный адрес, Москва',
            'status': 'completed',
            'contractor': users['olga_cleaner'],
            'completed_at': now - timedelta(days=11),
        },

        {
            'title': '[РАСШИРЕННЫЙ] Ремонт кухни под ключ',
            'description': 'Комплексный ремонт кухни 10 кв.м. Нужно: демонтаж старой отделки, выравнивание стен, укладка плитки на фартук, покраска, монтаж нового гарнитура. Работа с поэтапной сдачей.',
            'customer': users['elena_customer'],
            'category': categories['repair'],
            'price': Decimal('85000.00'),
            'latitude': Decimal('55.753201'),
            'longitude': Decimal('37.622456'),
            'address': 'Демонстрационный адрес, Москва',
            'status': 'open',
            'is_extended': True,
            'guarantee_days': 180,
            'guarantee_description': 'Гарантия 6 месяцев на все отделочные работы. При обнаружении дефектов — бесплатное устранение в течение 7 дней.',
        },
        {
            'title': '[РАСШИРЕННЫЙ] Замена электропроводки в 3-комнатной квартире',
            'description': 'Полная замена электропроводки: штробление, прокладка кабеля, установка новой распредкоробки и щитка, монтаж розеток и выключателей, подключение освещения.',
            'customer': users['pavel_customer'],
            'category': categories['electrician'],
            'price': Decimal('120000.00'),
            'latitude': Decimal('55.759234'),
            'longitude': Decimal('37.636789'),
            'address': 'Демонстрационный адрес, Москва',
            'status': 'in_progress',
            'contractor': users['sergey_electro'],
            'is_extended': True,
            'guarantee_days': 365,
            'guarantee_description': 'Гарантия 1 год на все электромонтажные работы. Соответствие требованиям ПУЭ.',
        },
        {
            'title': '[РАСШИРЕННЫЙ] Капитальный ремонт санузла',
            'description': 'Полный ремонт санузла: демонтаж, замена труб, гидроизоляция, укладка плитки, установка сантехники, подключение.',
            'customer': users['maria_customer'],
            'category': categories['repair'],
            'price': Decimal('95000.00'),
            'latitude': Decimal('55.746789'),
            'longitude': Decimal('37.613456'),
            'address': 'Демонстрационный адрес, Москва',
            'status': 'completed',
            'contractor': users['dmitry_builder'],
            'completed_at': now - timedelta(days=15),
            'is_extended': True,
            'guarantee_days': 365,
            'guarantee_description': 'Гарантия 1 год на ремонтные работы и 3 года на гидроизоляцию. Устранение протечек в течение 48 часов.',
        },
    ]

    jobs = []
    for job_data in jobs_data:
        job = Job.objects.create(**job_data)
        jobs.append(job)

    print(f'✓ Создано {len(jobs)} заказов (в том числе 3 расширенных)')
    return jobs


def create_stages(jobs):
    """Создать этапы для расширенных заказов."""
    now = timezone.now()
    extended_jobs = [j for j in jobs if j.is_extended]

    stages_count = 0

    kitchen_remodel = next(
        (j for j in extended_jobs if 'Ремонт кухни' in j.title), None
    )
    if kitchen_remodel:
        start = now + timedelta(days=3)
        kitchen_stages = [
            {
                'order': 1,
                'title': 'Демонтаж старой отделки',
                'description': 'Удаление старой плитки, обоев, подготовка стен',
                'planned_start': start,
                'planned_end': start + timedelta(days=2),
                'estimated_hours': Decimal('12.00'),
                'resources': 'Перфоратор, мешки для мусора, стремянка',
                'responsible': 'contractor',
                'status': 'pending',
            },
            {
                'order': 2,
                'title': 'Выравнивание стен и потолка',
                'description': 'Штукатурка, шпаклёвка, грунтовка',
                'planned_start': start + timedelta(days=2),
                'planned_end': start + timedelta(days=5),
                'estimated_hours': Decimal('20.00'),
                'resources': 'Штукатурка, шпаклёвка, грунтовка, шпатели',
                'responsible': 'contractor',
                'status': 'pending',
            },
            {
                'order': 3,
                'title': 'Укладка плитки на фартук',
                'description': 'Монтаж керамической плитки рабочей зоны',
                'planned_start': start + timedelta(days=5),
                'planned_end': start + timedelta(days=7),
                'estimated_hours': Decimal('14.00'),
                'resources': 'Плитка, плиточный клей, затирка, крестики',
                'responsible': 'contractor',
                'status': 'pending',
            },
            {
                'order': 4,
                'title': 'Покраска стен и потолка',
                'description': 'Нанесение водоэмульсионной краски в 2 слоя',
                'planned_start': start + timedelta(days=7),
                'planned_end': start + timedelta(days=9),
                'estimated_hours': Decimal('10.00'),
                'resources': 'Краска (15 л), валики, кисти, малярная лента',
                'responsible': 'contractor',
                'status': 'pending',
            },
            {
                'order': 5,
                'title': 'Монтаж кухонного гарнитура',
                'description': 'Сборка и установка кухонной мебели',
                'planned_start': start + timedelta(days=9),
                'planned_end': start + timedelta(days=11),
                'estimated_hours': Decimal('16.00'),
                'resources': 'Гарнитур (привозит заказчик), электроинструмент',
                'responsible': 'both',
                'status': 'pending',
            },
        ]
        for stage in kitchen_stages:
            JobStage.objects.create(job=kitchen_remodel, **stage)
            stages_count += 1

    electro_rewire = next(
        (j for j in extended_jobs if 'электропроводки' in j.title), None
    )
    if electro_rewire:
        start = now - timedelta(days=5)
        electro_stages = [
            {
                'order': 1,
                'title': 'Разметка и штробление',
                'description': 'Нанесение схемы проводки на стены, штробление под кабель',
                'planned_start': start,
                'planned_end': start + timedelta(days=2),
                'estimated_hours': Decimal('16.00'),
                'resources': 'Штроборез, перфоратор, карандаш, уровень',
                'responsible': 'contractor',
                'status': 'done',
                'actual_start': start + timedelta(hours=2),
                'actual_end': start + timedelta(days=1, hours=18),
            },
            {
                'order': 2,
                'title': 'Прокладка силового кабеля',
                'description': 'Укладка кабеля ВВГнг по штробам',
                'planned_start': start + timedelta(days=2),
                'planned_end': start + timedelta(days=4),
                'estimated_hours': Decimal('18.00'),
                'resources': 'Кабель ВВГнг 3x2.5, гофра, крепёж',
                'responsible': 'contractor',
                'status': 'done',
                'actual_start': start + timedelta(days=2),
                'actual_end': start + timedelta(days=4, hours=2),
            },
            {
                'order': 3,
                'title': 'Монтаж распредщитка',
                'description': 'Установка нового распределительного щитка, автоматов и УЗО',
                'planned_start': start + timedelta(days=4),
                'planned_end': start + timedelta(days=6),
                'estimated_hours': Decimal('10.00'),
                'resources': 'Щиток, автоматы, УЗО, DIN-рейка',
                'responsible': 'contractor',
                'status': 'in_progress',
                'actual_start': start + timedelta(days=4, hours=3),
            },
            {
                'order': 4,
                'title': 'Установка розеток и выключателей',
                'description': 'Монтаж всех розеток и выключателей, подключение к сети',
                'planned_start': start + timedelta(days=6),
                'planned_end': start + timedelta(days=8),
                'estimated_hours': Decimal('12.00'),
                'resources': 'Розетки (28 шт), выключатели (12 шт), подрозетники',
                'responsible': 'contractor',
                'status': 'pending',
            },
            {
                'order': 5,
                'title': 'Проверка и сдача',
                'description': 'Тестирование всех линий, измерение сопротивления изоляции',
                'planned_start': start + timedelta(days=8),
                'planned_end': start + timedelta(days=9),
                'estimated_hours': Decimal('4.00'),
                'resources': 'Мультиметр, мегаомметр',
                'responsible': 'both',
                'status': 'pending',
            },
        ]
        for stage in electro_stages:
            JobStage.objects.create(job=electro_rewire, **stage)
            stages_count += 1

    bathroom_remodel = next(
        (j for j in extended_jobs if 'санузла' in j.title), None
    )
    if bathroom_remodel:
        start = now - timedelta(days=35)
        bathroom_stages = [
            {
                'order': 1,
                'title': 'Демонтаж старой отделки и сантехники',
                'description': 'Снос плитки, демонтаж ванны, унитаза, раковины',
                'planned_start': start,
                'planned_end': start + timedelta(days=2),
                'estimated_hours': Decimal('14.00'),
                'resources': 'Перфоратор, мешки, тележка',
                'responsible': 'contractor',
                'status': 'done',
                'actual_start': start,
                'actual_end': start + timedelta(days=2, hours=3),
            },
            {
                'order': 2,
                'title': 'Замена труб водоснабжения и канализации',
                'description': 'Прокладка новых полипропиленовых труб',
                'planned_start': start + timedelta(days=2),
                'planned_end': start + timedelta(days=5),
                'estimated_hours': Decimal('20.00'),
                'resources': 'Трубы PPR, фитинги, паяльник',
                'responsible': 'contractor',
                'status': 'done',
                'actual_start': start + timedelta(days=2, hours=4),
                'actual_end': start + timedelta(days=5),
            },
            {
                'order': 3,
                'title': 'Гидроизоляция пола и стен',
                'description': 'Нанесение двухкомпонентной гидроизоляции',
                'planned_start': start + timedelta(days=5),
                'planned_end': start + timedelta(days=7),
                'estimated_hours': Decimal('8.00'),
                'resources': 'Гидроизоляция, армирующая лента',
                'responsible': 'contractor',
                'status': 'done',
                'actual_start': start + timedelta(days=5, hours=2),
                'actual_end': start + timedelta(days=7),
            },
            {
                'order': 4,
                'title': 'Укладка плитки',
                'description': 'Монтаж керамической плитки на пол и стены',
                'planned_start': start + timedelta(days=7),
                'planned_end': start + timedelta(days=13),
                'estimated_hours': Decimal('40.00'),
                'resources': 'Плитка, клей, крестики, затирка',
                'responsible': 'contractor',
                'status': 'done',
                'actual_start': start + timedelta(days=7, hours=2),
                'actual_end': start + timedelta(days=14, hours=6),
            },
            {
                'order': 5,
                'title': 'Установка сантехники',
                'description': 'Монтаж ванны, унитаза, раковины, подключение',
                'planned_start': start + timedelta(days=14),
                'planned_end': start + timedelta(days=17),
                'estimated_hours': Decimal('16.00'),
                'resources': 'Сантехника (привозит заказчик), герметик',
                'responsible': 'both',
                'status': 'done',
                'actual_start': start + timedelta(days=15),
                'actual_end': start + timedelta(days=17, hours=4),
            },
            {
                'order': 6,
                'title': 'Финишная отделка и уборка',
                'description': 'Затирка швов, монтаж аксессуаров, финальная уборка',
                'planned_start': start + timedelta(days=17),
                'planned_end': start + timedelta(days=20),
                'estimated_hours': Decimal('10.00'),
                'resources': 'Затирка, герметик, аксессуары',
                'responsible': 'contractor',
                'status': 'done',
                'actual_start': start + timedelta(days=17, hours=5),
                'actual_end': start + timedelta(days=20),
            },
        ]
        for stage in bathroom_stages:
            JobStage.objects.create(job=bathroom_remodel, **stage)
            stages_count += 1

    print(f'✓ Создано {stages_count} этапов для расширенных заказов')


def create_applications(users, jobs):
    open_jobs = [j for j in jobs if j.status == 'open' and not j.is_extended]
    extended_open = [j for j in jobs if j.status == 'open' and j.is_extended]

    applications_data = [
        {
            'job': open_jobs[0],
            'contractor': users['ivan_santehnik'],
            'message': 'Добрый день! Готов выполнить работу сегодня. Есть весь необходимый инструмент. Опыт работы 8 лет.',
            'proposed_price': Decimal('1500.00'),
            'status': 'pending',
        },
        {
            'job': open_jobs[1],
            'contractor': users['sergey_electro'],
            'message': 'Здравствуйте! Могу приехать завтра после обеда. Есть все необходимое для установки, включая стремянку.',
            'proposed_price': Decimal('2000.00'),
            'status': 'pending',
        },
        {
            'job': open_jobs[2],
            'contractor': users['olga_cleaner'],
            'message': 'Добрый день! Выполню уборку качественно. Есть профессиональная техника и средства.',
            'proposed_price': Decimal('4800.00'),
            'status': 'pending',
        },
        {
            'job': open_jobs[3],
            'contractor': users['alex_it'],
            'message': 'Здравствуйте! Настрою сеть, проверю покрытие, при необходимости порекомендую дополнительное оборудование.',
            'proposed_price': Decimal('2500.00'),
            'status': 'pending',
        },
        {
            'job': open_jobs[3],
            'contractor': users['sergey_electro'],
            'message': 'Добрый день! Также занимаюсь настройкой сетевого оборудования.',
            'proposed_price': Decimal('2800.00'),
            'status': 'pending',
        },
    ]

    if extended_open:
        applications_data.append({
            'job': extended_open[0],
            'contractor': users['dmitry_builder'],
            'message': 'Готов взяться. 12 лет опыта ремонта кухонь под ключ. Работаю строго по этапам с фотоотчётом.',
            'proposed_price': Decimal('82000.00'),
            'status': 'pending',
        })

    for app_data in applications_data:
        JobApplication.objects.create(**app_data)

    print(f'✓ Создано {len(applications_data)} откликов')


def create_reviews(users, jobs):
    completed_jobs = [j for j in jobs if j.status == 'completed']

    reviews_data = [
        {
            'job': completed_jobs[0],
            'reviewer': users['maria_customer'],
            'reviewee': users['ivan_santehnik'],
            'rating': 5,
            'comment': 'Отличная работа! Приехал вовремя, быстро устранил проблему. Все чисто, аккуратно. Рекомендую!',
        },
        {
            'job': completed_jobs[1],
            'reviewer': users['pavel_customer'],
            'reviewee': users['ivan_santehnik'],
            'rating': 5,
            'comment': 'Профессионал своего дела. Подключил машинку, все работает отлично. Спасибо!',
        },
        {
            'job': completed_jobs[2],
            'reviewer': users['elena_customer'],
            'reviewee': users['alex_it'],
            'rating': 4,
            'comment': 'Хорошо почистил систему, компьютер стал работать быстрее. Единственное - немного задержался по времени.',
        },
        {
            'job': completed_jobs[3],
            'reviewer': users['maria_customer'],
            'reviewee': users['olga_cleaner'],
            'rating': 5,
            'comment': 'Превосходная уборка! Квартира блестит. Ольга очень ответственная и внимательная к деталям.',
        },
    ]

    extended_completed = next(
        (j for j in completed_jobs if j.is_extended), None
    )
    if extended_completed:
        reviews_data.append({
            'job': extended_completed,
            'reviewer': users['maria_customer'],
            'reviewee': users['dmitry_builder'],
            'rating': 5,
            'comment': 'Дмитрий отлично справился со сложным проектом. Каждый этап сдавался с фотоотчётом, сроки не нарушались. Гарантия даёт уверенность в качестве.',
        })

    for review_data in reviews_data:
        Review.objects.create(**review_data)

    print(f'✓ Создано {len(reviews_data)} отзывов')


def create_guarantee_claims(users, jobs):
    """Создать обращение по гарантии для демонстрации."""
    extended_completed = [
        j for j in jobs if j.is_extended and j.status == 'completed' and j.guarantee_days
    ]
    if not extended_completed:
        print('✓ Обращения по гарантии: пропущено (нет подходящих заказов)')
        return

    job = extended_completed[0]
    GuaranteeClaim.objects.create(
        job=job,
        customer=job.customer,
        description='Через неделю после сдачи обнаружила небольшую протечку в месте соединения смесителя с гибкой подводкой. Прошу устранить по гарантии.',
        status='in_review',
    )
    print('✓ Создано 1 обращение по гарантии')


def create_chats(users, jobs):
    in_progress_jobs = [j for j in jobs if j.status == 'in_progress']
    completed_jobs = [j for j in jobs if j.status == 'completed']

    chats_data = []

    simple_in_progress = [j for j in in_progress_jobs if not j.is_extended]
    if simple_in_progress:
        chat1 = ChatRoom.objects.create(job=simple_in_progress[0])
        chats_data.append({
            'chat': chat1,
            'messages': [
                {
                    'sender': simple_in_progress[0].customer,
                    'content': 'Здравствуйте! Когда сможете приехать?',
                    'created_at': timezone.now() - timedelta(days=1, hours=2),
                },
                {
                    'sender': simple_in_progress[0].contractor,
                    'content': 'Добрый день! Могу приехать завтра в 14:00. Вам удобно?',
                    'created_at': timezone.now() - timedelta(days=1, hours=1),
                    'is_read': True,
                },
                {
                    'sender': simple_in_progress[0].customer,
                    'content': 'Да, отлично. Жду вас.',
                    'created_at': timezone.now() - timedelta(hours=23),
                    'is_read': True,
                },
                {
                    'sender': simple_in_progress[0].contractor,
                    'content': 'Выехал, буду через 20 минут.',
                    'created_at': timezone.now() - timedelta(hours=2),
                },
            ]
        })

    if len(simple_in_progress) > 1:
        chat2 = ChatRoom.objects.create(job=simple_in_progress[1])
        chats_data.append({
            'chat': chat2,
            'messages': [
                {
                    'sender': simple_in_progress[1].customer,
                    'content': 'Дмитрий, как продвигается работа?',
                    'created_at': timezone.now() - timedelta(hours=4),
                    'is_read': True,
                },
                {
                    'sender': simple_in_progress[1].contractor,
                    'content': 'Все идет по плану. Сегодня закончу укладку стен, завтра начну пол.',
                    'created_at': timezone.now() - timedelta(hours=3),
                    'is_read': True,
                },
                {
                    'sender': simple_in_progress[1].customer,
                    'content': 'Отлично! Можно посмотреть результат вечером?',
                    'created_at': timezone.now() - timedelta(hours=2),
                },
                {
                    'sender': simple_in_progress[1].contractor,
                    'content': 'Конечно, приезжайте после 18:00.',
                    'created_at': timezone.now() - timedelta(hours=1),
                },
            ]
        })

    simple_completed = [j for j in completed_jobs if not j.is_extended]
    if simple_completed:
        chat3 = ChatRoom.objects.create(job=simple_completed[0])
        chats_data.append({
            'chat': chat3,
            'messages': [
                {
                    'sender': simple_completed[0].customer,
                    'content': 'Спасибо большое! Все отлично!',
                    'created_at': timezone.now() - timedelta(days=5),
                    'is_read': True,
                },
                {
                    'sender': simple_completed[0].contractor,
                    'content': 'Рад помочь! Если что-то понадобится - обращайтесь.',
                    'created_at': timezone.now() - timedelta(days=5),
                    'is_read': True,
                },
            ]
        })

    extended_in_progress = next(
        (j for j in in_progress_jobs if j.is_extended), None
    )
    if extended_in_progress:
        chat4 = ChatRoom.objects.create(job=extended_in_progress)
        stages = list(extended_in_progress.stages.order_by('order'))
        msgs = [
            {
                'sender': extended_in_progress.customer,
                'content': 'Здравствуйте, Сергей! План работ согласован, можем начинать?',
                'created_at': timezone.now() - timedelta(days=6),
                'is_read': True,
            },
            {
                'sender': extended_in_progress.contractor,
                'content': 'Добрый день! Да, всё готово. Начну с первого этапа завтра утром.',
                'created_at': timezone.now() - timedelta(days=6, hours=-1),
                'is_read': True,
            },
        ]
        for stage in stages:
            if stage.actual_start:
                msgs.append({
                    'sender': extended_in_progress.contractor,
                    'content': f'🔧 [Этап] Начат: «{stage.title}»',
                    'created_at': stage.actual_start,
                    'is_read': True,
                })
            if stage.actual_end:
                msgs.append({
                    'sender': extended_in_progress.contractor,
                    'content': f'✅ [Этап] Завершён: «{stage.title}»',
                    'created_at': stage.actual_end,
                    'is_read': True,
                })
        msgs.append({
            'sender': extended_in_progress.customer,
            'content': 'Хорошо двигаемся, спасибо за отчётность по этапам!',
            'created_at': timezone.now() - timedelta(hours=6),
        })
        chats_data.append({'chat': chat4, 'messages': msgs})

    for chat_data in chats_data:
        for msg_data in chat_data['messages']:
            Message.objects.create(chat_room=chat_data['chat'], **msg_data)

    print(f'✓ Создано {len(chats_data)} чатов с сообщениями')


if __name__ == '__main__':
    print('Инициализация базы данных...\n')

    users = create_users()
    categories = create_categories()

    if Job.objects.exists():
        print('✓ Заказы уже существуют — пропускаем повторное наполнение')
    else:
        jobs = create_jobs(users, categories)
        create_stages(jobs)
        create_applications(users, jobs)
        create_reviews(users, jobs)
        create_guarantee_claims(users, jobs)
        create_chats(users, jobs)

    print('\n✓ Готово!')
    print('Демо-пользователи созданы с паролем из DEMO_PASSWORD.')
