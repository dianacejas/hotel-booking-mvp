/** Configuración editable del alojamiento (marca, contacto y redes). */
export interface SiteConfig {
  name: string;
  tagline: string;
  phone: string;
  phoneHref: string;
  whatsappNumber: string;
  whatsappMessage: string;
  email: string;
  emailHref: string;
  address: string;
  instagram: string;
  facebook: string;
  /** Nombre corto para la barra de navegación y contextos compactos. */
  shortName: string;
}

const site: SiteConfig = {
  name: 'Altos del Lago Lodge & Boutique',
  shortName: 'Altos del Lago',
  tagline: 'Lodge & boutique a orillas del lago, en plena Patagonia.',
  phone: '+54 9 2944 00 0000',
  phoneHref: 'tel:+5492944000000',
  whatsappNumber: '5492944000000',
  whatsappMessage:
    'Hola, me gustaría consultar disponibilidad para alojarme en Altos del Lago Lodge & Boutique.',
  email: 'reservas@altosdellago.com.ar',
  emailHref: 'mailto:reservas@altosdellago.com.ar',
  address: 'Av. San Martín 898, Q8370 San Martín de los Andes, Neuquén',
  instagram: 'https://instagram.com/altosdellagolodge',
  facebook: 'https://facebook.com/altosdellagolodge',
};

export default site;