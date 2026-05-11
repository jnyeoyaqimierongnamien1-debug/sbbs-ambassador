'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const sections = [
  {
    id: 1,
    icon: '📲',
    title: "Installation de l'application",
    tag: 'Débutant',
    steps: [
      { type: 'heading', text: 'Sur Android (Chrome)' },
      { type: 'step', num: '①', text: "Ouvrez sbbs-app.vercel.app dans Chrome" },
      { type: 'step', num: '②', text: "Un bouton violet 'Installer l'app' apparaît en haut de la page de login" },
      { type: 'step', num: '③', text: "Appuyez dessus et confirmez — l'icône SBBS apparaît sur votre écran d'accueil" },
      { type: 'heading', text: 'Sur iPhone (Safari)' },
      { type: 'step', num: '①', text: "Ouvrez sbbs-app.vercel.app dans Safari" },
      { type: 'step', num: '②', text: "Appuyez sur le bouton Partager (carré avec flèche)" },
      { type: 'step', num: '③', text: "Sélectionnez 'Sur l'écran d'accueil' — confirmez" },
      { type: 'tip', text: "💡 L'installation PWA vous permet d'accéder à l'app sans saisir l'URL à chaque fois." },
    ],
  },
  {
    id: 2,
    icon: '✍️',
    title: 'Inscription et création de compte',
    tag: 'Débutant',
    steps: [
      { type: 'step', num: '①', text: "Sur la page de login, appuyez sur '🤝 Rejoindre le réseau'" },
      { type: 'step', num: '②', text: "Remplissez le formulaire : nom, prénom, email, téléphone, mot de passe" },
      { type: 'step', num: '③', text: "Validez — votre compte est créé avec le statut 'En attente de validation'" },
      { type: 'step', num: '④', text: "Vous serez contacté(e) sous 24h sur WhatsApp pour l'activation" },
      { type: 'tip', text: "⚠️ Tant que votre compte n'est pas validé, la connexion affichera un message d'attente." },
    ],
  },
  {
    id: 3,
    icon: '🔐',
    title: 'Connexion et navigation',
    tag: 'Débutant',
    steps: [
      { type: 'step', num: '①', text: "Saisissez votre email et mot de passe sur la page de login" },
      { type: 'step', num: '②', text: "Appuyez sur 'Se connecter' — vous êtes redirigé vers votre espace" },
      { type: 'step', num: '③', text: "Les ambassadeurs arrivent sur 'Mon Espace', les directeurs sur 'Espace Directeur'" },
      { type: 'heading', text: 'Navigation principale' },
      { type: 'bullet', text: "Bouton violet 🤖 en bas à droite : ouvre l'assistant ALEX" },
      { type: 'bullet', text: "Bouton bleu 💬 en bas à droite : ouvre la messagerie" },
    ],
  },
  {
    id: 4,
    icon: '🏠',
    title: 'Mon Espace Ambassadeur',
    tag: 'Débutant',
    steps: [
      { type: 'body', text: "Votre tableau de bord personnel, accessible dès la connexion." },
      { type: 'heading', text: 'Ce que vous y trouvez' },
      { type: 'bullet', text: "Votre niveau : 🥉 Bronze (0-2) | 🥈 Argent (3-9) | 🥇 Or (10-24) | 💎 Platine (25+)" },
      { type: 'bullet', text: "Le total de vos filleuls enregistrés" },
      { type: 'bullet', text: "Le cumul de vos commissions générées" },
      { type: 'bullet', text: "La liste détaillée de vos filleuls avec branche et statut" },
    ],
  },
  {
    id: 5,
    icon: '➕',
    title: 'Ajouter un filleul',
    tag: 'Essentiel',
    steps: [
      { type: 'body', text: "C'est l'action principale de l'ambassadeur. Chaque filleul ajouté génère une commission." },
      { type: 'step', num: '①', text: "Dans Mon Espace, appuyez sur '+ Ajouter un filleul'" },
      { type: 'step', num: '②', text: "Renseignez : nom, prénom, téléphone du filleul" },
      { type: 'step', num: '③', text: "Choisissez la branche : SBBS Certification | CHLA | Édition | Consulting" },
      { type: 'step', num: '④', text: "Choisissez le type : 🔥 À chaud (vous gérez seul) ou 🤝 Assisté (direction intervient)" },
      { type: 'step', num: '⑤', text: "La commission est calculée automatiquement — validez l'enregistrement" },
      { type: 'tip', text: "💡 À chaud = meilleure commission pour SBBS Certification (30 000 FCFA vs 12 000 FCFA)." },
    ],
  },
  {
    id: 6,
    icon: '💰',
    title: 'Comprendre les commissions',
    tag: 'Essentiel',
    steps: [
      { type: 'table', rows: [
        ['Branche', 'À Chaud', 'Assisté'],
        ['SBBS Certification', '30 000 FCFA', '12 000 FCFA'],
        ['CHLA', '10 000 FCFA', '10 000 FCFA'],
        ['SBBS Édition', '1 000 FCFA', '1 000 FCFA'],
        ['SBBS Consulting', '60 000 FCFA', '60 000 FCFA'],
      ]},
      { type: 'tip', text: "⚠️ Les commissions sont versées après validation effective du paiement par le filleul." },
    ],
  },
  {
    id: 7,
    icon: '💬',
    title: 'La messagerie interne',
    tag: 'Confirmé',
    steps: [
      { type: 'bullet', text: "L'icône 💬 bleue en bas à droite indique les nouveaux messages" },
      { type: 'bullet', text: "Un badge rouge affiche le nombre de messages non lus" },
      { type: 'bullet', text: "Appuyez pour ouvrir la messagerie et répondre en temps réel" },
      { type: 'bullet', text: "Les messages sont synchronisés instantanément entre tous les utilisateurs" },
    ],
  },
  {
    id: 8,
    icon: '🤖',
    title: 'L\'assistant ALEX',
    tag: 'Essentiel',
    steps: [
      { type: 'body', text: "ALEX est votre expert SBBS disponible 24h/24, 7j/7. Il connaît toutes les branches, commissions et argumentaires." },
      { type: 'heading', text: 'Questions utiles à poser à ALEX' },
      { type: 'bullet', text: "\"Quelle commission si j'inscris quelqu'un à chaud en Consulting ?\"" },
      { type: 'bullet', text: "\"Comment présenter SBBS à un salarié ?\"" },
      { type: 'bullet', text: "\"Quels sont les 6 actifs de la CHLA ?\"" },
      { type: 'bullet', text: "\"Comment gérer l'objection c'est trop cher ?\"" },
      { type: 'tip', text: "💡 ALEX accepte aussi les images et documents PDF pour analyse." },
    ],
  },
  {
    id: 9,
    icon: '🏫',
    title: 'Espace Directeur',
    tag: 'Directeur',
    steps: [
      { type: 'body', text: "Réservé aux directeurs validés. Accessible via 'Espace Directeur' sur la page de login." },
      { type: 'bullet', text: "Vue globale de tous les ambassadeurs et leurs filleuls" },
      { type: 'bullet', text: "Statistiques du réseau en temps réel" },
      { type: 'bullet', text: "Gestion et validation des comptes ambassadeurs" },
      { type: 'bullet', text: "Messagerie avec l'ensemble du réseau" },
    ],
  },
  {
    id: 10,
    icon: '⚙️',
    title: 'Paramètres et compte',
    tag: 'Confirmé',
    steps: [
      { type: 'step', num: '①', text: "Accédez aux paramètres depuis le menu de navigation" },
      { type: 'step', num: '②', text: "Modifiez votre profil : nom, photo, informations de contact" },
      { type: 'step', num: '③', text: "Changez votre mot de passe en toute sécurité" },
      { type: 'step', num: '④', text: "Déconnectez-vous via le bouton de déconnexion" },
    ],
  },
  {
    id: 11,
    icon: '📋',
    title: "Conditions d'utilisation",
    tag: 'Info',
    steps: [
      { type: 'body', text: "Les CGU sont accessibles directement dans l'application via le lien en bas de la page de login, ou en naviguant vers /cgu." },
    ],
  },
  {
    id: 12,
    icon: '📞',
    title: 'Support et contacts',
    tag: 'Info',
    steps: [
      { type: 'bullet', text: "Messagerie intégrée : contactez directement la direction commerciale SBBS" },
      { type: 'bullet', text: "Tél : +225 07 09 20 61 81 / 07 08 76 18 40" },
      { type: 'bullet', text: "Email : mde@intelligentpartnership.net" },
      { type: 'bullet', text: "Siège : Cocody – Riviera 4 – Cité Terre Afrique, Abidjan" },
    ],
  },
];

const tagColors: Record<string, { bg: string; text: string }> = {
  'Débutant':  { bg: '#DCFCE7', text: '#16A34A' },
  'Essentiel': { bg: '#FEF3C7', text: '#D97706' },
  'Confirmé':  { bg: '#EDE9FE', text: '#7C3AED' },
  'Directeur': { bg: '#DBEAFE', text: '#1D4ED8' },
  'Info':      { bg: '#F1F5F9', text: '#64748B' },
};

export default function GuideUtilisateurPage() {
  const router = useRouter();
  const [openSection, setOpenSection] = useState<number | null>(1);
  const [filter, setFilter] = useState<string>('Tous');

  const filters = ['Tous', 'Débutant', 'Essentiel', 'Confirmé', 'Directeur'];
  const filtered = filter === 'Tous' ? sections : sections.filter(s => s.tag === filter);

  return (
    <div className="min-h-screen pb-10" style={{ background: '#F0F2F5' }}>

      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-3 shadow-lg sticky top-0 z-10"
        style={{ background: 'linear-gradient(135deg, #1A3A6C 0%, #2563EB 100%)' }}>
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white text-sm transition">
          ← Retour
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-white text-sm">Guide Utilisateur</h1>
          <p className="text-xs text-blue-200">SBBS Ambassador · Toutes les fonctionnalités</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* Intro */}
        <div className="rounded-2xl p-5 mb-5 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #1A3A6C, #2563EB)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(201,168,76,0.2)' }}>📖</div>
            <div>
              <p className="font-bold text-white text-sm">SBBS Ambassador</p>
              <p className="text-xs" style={{ color: '#C9A84C' }}>Guide complet — Version 1.0 · Mai 2026</p>
            </div>
          </div>
          <p className="text-xs text-blue-100 leading-relaxed">
            Ce guide vous accompagne pas à pas dans la prise en main de toutes les fonctionnalités,
            que vous soyez ambassadeur débutant, confirmé ou directeur.
          </p>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl font-semibold transition"
              style={filter === f
                ? { background: '#1A3A6C', color: 'white' }
                : { background: 'white', color: '#64748B', border: '1px solid #E2E8F0' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {filtered.map(section => {
            const tagStyle = tagColors[section.tag] || tagColors['Info'];
            return (
              <div key={section.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                  className="w-full px-4 py-4 flex items-center justify-between text-left">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0">{section.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1A3A6C' }}>
                        {section.id}. {section.title}
                      </p>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md"
                        style={{ background: tagStyle.bg, color: tagStyle.text }}>
                        {section.tag}
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-400 text-lg ml-2 flex-shrink-0">
                    {openSection === section.id ? '−' : '+'}
                  </span>
                </button>

                {openSection === section.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
                    {section.steps.map((item, i) => {
                      if (item.type === 'heading') return (
                        <p key={i} className="text-xs font-bold mt-2" style={{ color: '#2563EB' }}>{item.text}</p>
                      );
                      if (item.type === 'step') return (
                        <div key={i} className="flex gap-2">
                          <span className="text-xs font-bold flex-shrink-0 mt-0.5" style={{ color: '#CC0000' }}>{item.num}</span>
                          <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                        </div>
                      );
                      if (item.type === 'bullet') return (
                        <p key={i} className="text-sm text-gray-600 pl-3 leading-relaxed">• {item.text}</p>
                      );
                      if (item.type === 'tip') return (
                        <p key={i} className="text-xs italic pl-3 leading-relaxed" style={{ color: '#2563EB' }}>{item.text}</p>
                      );
                      if (item.type === 'body') return (
                        <p key={i} className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                      );
                      if (item.type === 'table' && item.rows) return (
                        <div key={i} className="overflow-x-auto mt-2">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr style={{ background: '#1A3A6C' }}>
                                {item.rows[0].map((h: string, j: number) => (
                                  <th key={j} className="text-white px-2 py-2 text-left font-semibold">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {item.rows.slice(1).map((row: string[], j: number) => (
                                <tr key={j} style={{ background: j % 2 === 0 ? '#F5F7FA' : 'white' }}>
                                  {row.map((cell: string, k: number) => (
                                    <td key={k} className="px-2 py-2 text-gray-700">{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                      return null;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Salomon Betsaleel Business School — Groupe SBBS
        </p>
      </div>
    </div>
  );
}
