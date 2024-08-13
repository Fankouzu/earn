import { Regions } from '@prisma/client';

export const Superteams = [
  {
    name: 'Superteam India',
    icons: '/assets/superteams/india.jpg',
    banner: '/assets/superteam-banners/India.png',
    region: Regions.INDIA,
    displayValue: 'India',
    country: ['India'],
    code: 'IN',
    hello: 'Namaste',
  },
  {
    name: 'Superteam Germany',
    icons: '/assets/superteams/germany.jpg',
    banner: '/assets/superteam-banners/Germany.png',
    region: Regions.GERMANY,
    displayValue: 'Germany',
    country: ['Germany'],
    code: 'DE',
    hello: 'Hallo',
  },
  {
    name: 'Superteam UK',
    icons: '/assets/superteams/uk.png',
    banner: '/assets/superteam-banners/UK.png',
    region: Regions.UK,
    displayValue: 'UK',
    country: ['United Kingdom'],
    code: 'GB',
    hello: 'Hello',
  },
  {
    name: 'Superteam Turkey',
    icons: '/assets/superteams/turkey.jpg',
    banner: '/assets/superteam-banners/Turkey.png',
    region: Regions.TURKEY,
    displayValue: 'Turkey',
    country: ['Turkey'],
    code: 'TR',
    hello: 'Merhaba',
  },
  {
    name: 'Superteam Vietnam',
    icons: '/assets/superteams/vietnam.png',
    banner: '/assets/superteam-banners/Vietnam.png',
    region: Regions.VIETNAM,
    displayValue: 'Vietnam',
    country: ['Vietnam'],
    code: 'VN',
    hello: 'Xin chào',
  },
  {
    name: 'Superteam UAE',
    icons: '/assets/superteams/uae.png',
    banner: '/assets/superteam-banners/UAE.png',
    region: Regions.UAE,
    displayValue: 'UAE',
    country: ['United Arab Emirates'],
    code: 'AE',
    hello: 'Marhaba',
  },
  {
    name: 'Superteam Nigeria',
    icons: '/assets/superteams/nigeria.png',
    banner: '/assets/superteam-banners/Nigeria.png',
    region: Regions.NIGERIA,
    displayValue: 'Nigeria',
    country: ['Nigeria'],
    code: 'NG',
    hello: 'Hello',
  },
  {
    name: 'Superteam Brazil',
    icons: '/assets/superteams/brazil.png',
    banner: '/assets/superteam-banners/Brazil.png',
    region: Regions.BRAZIL,
    displayValue: 'Brazil',
    country: ['Brazil'],
    code: 'BR',
    hello: 'Olá',
  },
  {
    name: 'Superteam Malaysia',
    icons: '/assets/superteams/malaysia.jpg',
    banner: '/assets/superteam-banners/Malaysia.png',
    region: Regions.MALAYSIA,
    displayValue: 'Malaysia',
    country: ['Malaysia'],
    code: 'MY',
    hello: 'Salaam',
  },
  {
    name: 'Superteam Balkan',
    icons: '/assets/superteams/balkan.png',
    banner: '/assets/superteam-banners/Balkan.png',
    region: Regions.BALKAN,
    displayValue: 'Balkan',
    country: [
      'Albania',
      'Bosnia and Herzegovina',
      'Bulgaria',
      'Croatia',
      'Kosovo',
      'Montenegro',
      'North Macedonia',
      'Romania',
      'Serbia',
      'Slovenia',
    ],
    code: 'BALKAN',
    hello: 'Pozdrav',
  },
  {
    name: 'Superteam Philippines',
    icons: '/assets/superteams/philippines.png',
    banner: '/assets/superteam-banners/Philippines.png',
    region: Regions.PHILIPPINES,
    displayValue: 'Philippines',
    country: ['Philippines'],
    code: 'PH',
    hello: 'Kumusta',
  },
  {
    name: 'Superteam Japan',
    icons: '/assets/superteams/japan.png',
    banner: '/assets/superteam-banners/Japan.png',
    region: Regions.JAPAN,
    displayValue: 'Japan',
    country: ['Japan'],
    code: 'JP',
    hello: `Kon'nichiwa`,
  },
  {
    name: 'Superteam France',
    icons: '/assets/superteams/france.png',
    banner: '/assets/superteam-banners/France.png',
    region: Regions.FRANCE,
    displayValue: 'France',
    country: ['France'],
    code: 'FR',
    hello: `Bonjour`,
  },
  {
    name: 'Superteam Mexico',
    icons: '/assets/superteams/mexico.jpg',
    banner: '/assets/superteam-banners/Mexico.png',
    region: Regions.MEXICO,
    displayValue: 'Mexico',
    country: ['Mexico'],
    code: 'MX',
    hello: `Hola`,
  },
  {
    name: 'Superteam Canada',
    icons: '/assets/superteams/canada.png',
    banner: '/assets/superteam-banners/Canada.png',
    region: Regions.CANADA,
    displayValue: 'Canada',
    country: ['Canada'],
    code: 'CA',
    hello: 'Hello',
  },
];

const NonSTRegions = [
  {
    region: Regions.UKRAINE,
    displayValue: 'Ukraine',
    country: ['Ukraine'],
    code: 'UA',
  },
  {
    region: Regions.ARGENTINA,
    displayValue: 'Argentina',
    country: ['Argentina'],
    code: 'AR',
  },
];

export const CombinedRegions = [...Superteams, ...NonSTRegions];
