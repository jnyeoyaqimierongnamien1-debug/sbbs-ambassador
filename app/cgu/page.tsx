'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const sections = [
  {
    id: 1,
    title: "Article 1 — Présentation et Objet",
    content: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de l'application SBBS Ambassador, plateforme numérique propriété du Groupe Intelligent Partnership (IP), opérée par la Salomon Betsaleel Business School (SBBS), école des affaires fondée le 13 mars 2021, dont le siège social est établi à Abidjan, Côte d'Ivoire.

L'application SBBS Ambassador a pour objet de :
• Permettre aux ambassadeurs de gérer leur réseau de filleuls et de suivre leurs commissions en temps réel ;
• Faciliter la communication interne entre ambassadeurs et direction commerciale SBBS ;
• Donner accès à l'assistant intelligent ALEX pour toute information relative aux produits et services SBBS ;
• Offrir un espace personnel de suivi de performance et de statistiques.`,
  },
  {
    id: 2,
    title: "Article 2 — Acceptation des CGU",
    content: `L'accès et l'utilisation de l'application SBBS Ambassador impliquent l'acceptation pleine et entière des présentes CGU. Tout utilisateur qui s'inscrit ou se connecte à l'application reconnaît avoir lu, compris et accepté ces conditions sans réserve.

En cas de désaccord avec tout ou partie des présentes CGU, l'utilisateur est invité à ne pas utiliser l'application et à contacter la direction SBBS pour toute question.`,
  },
  {
    id: 3,
    title: "Article 3 — Accès et Inscription",
    content: `3.1 Conditions d'accès
L'application est réservée aux personnes physiques majeures (18 ans et plus) ayant préalablement utilisé l'un des services ou produits du groupe SBBS et ayant été officiellement enrôlées comme ambassadeurs du réseau SBBS, ou aux directeurs et administrateurs autorisés par la direction du Groupe SBBS.

3.2 Création de compte
L'inscription requiert la fourniture d'informations exactes, complètes et à jour : nom, prénom, adresse email valide et mot de passe sécurisé. L'utilisateur est seul responsable de la confidentialité de ses identifiants de connexion.

3.3 Sécurité du compte
Tout accès à l'application via les identifiants d'un utilisateur est présumé effectué par cet utilisateur. En cas de perte ou de compromission de ses identifiants, l'utilisateur doit en informer immédiatement la direction SBBS.`,
  },
  {
    id: 4,
    title: "Article 4 — Fonctionnalités et Services",
    content: `L'application SBBS Ambassador met à la disposition des utilisateurs les fonctionnalités suivantes :

• Mon Espace : tableau de bord personnel avec suivi des filleuls, commissions générées et niveau ambassadeur ;
• Ajout de filleuls : enregistrement des prospects parrainés avec choix de la branche et du type de parrainage ;
• Messagerie interne : système de communication sécurisé entre ambassadeurs et direction commerciale ;
• Assistant ALEX : assistant intelligent disponible 24h/24 pour répondre aux questions sur les produits, commissions et argumentaires SBBS ;
• Espace Directeur : tableau de bord réservé à la direction pour la gestion globale du réseau ambassadeur.`,
  },
  {
    id: 5,
    title: "Article 5 — Obligations de l'Utilisateur",
    content: `En utilisant l'application, l'utilisateur s'engage à :

• Fournir des informations exactes et sincères lors de l'inscription et de l'enregistrement des filleuls ;
• Ne pas usurper l'identité d'un autre ambassadeur ou d'un membre de la direction SBBS ;
• Ne pas utiliser l'application à des fins frauduleuses, illicites ou contraires aux valeurs du Groupe SBBS ;
• Ne pas tenter de pirater, modifier ou altérer le fonctionnement de l'application ;
• Respecter la confidentialité des informations des autres utilisateurs et des données commerciales SBBS ;
• Signaler immédiatement tout dysfonctionnement ou usage abusif constaté.`,
  },
  {
    id: 6,
    title: "Article 6 — Commissions et Rémunération",
    content: `Les commissions versées aux ambassadeurs sont calculées selon le barème officiel SBBS en vigueur. Ces taux peuvent être révisés par la direction du Groupe SBBS avec un préavis d'un (1) mois communiqué via l'application.

Barème des commissions :
• SBBS Certification (60 000 FCFA) → À chaud : 30 000 FCFA | Assisté : 12 000 FCFA
• CHLA (100 000 FCFA) → À chaud ou assisté : 10 000 FCFA
• SBBS Édition (10 000 FCFA) → À chaud ou assisté : 1 000 FCFA
• SBBS Consulting (600 000 FCFA) → À chaud ou assisté : 60 000 FCFA

Le versement des commissions est conditionné à la validation effective de l'inscription et du paiement par le filleul. Toute contestation doit être adressée à la direction commerciale SBBS dans un délai de 30 jours.`,
  },
  {
    id: 7,
    title: "Article 7 — Données Personnelles et Confidentialité",
    content: `Le Groupe SBBS collecte et traite les données personnelles des utilisateurs dans le strict respect de la législation ivoirienne en vigueur sur la protection des données personnelles.

Les données collectées sont utilisées exclusivement pour :
• La gestion des comptes ambassadeurs et le calcul des commissions ;
• L'amélioration des services de l'application ;
• Les communications officielles SBBS relatives au réseau ambassadeur.

Les données ne sont en aucun cas vendues, cédées ou transmises à des tiers sans le consentement explicite de l'utilisateur, sauf obligation légale. L'utilisateur dispose d'un droit d'accès, de rectification et de suppression de ses données en contactant la direction SBBS.`,
  },
  {
    id: 8,
    title: "Article 8 — Propriété Intellectuelle",
    content: `L'ensemble des éléments composant l'application SBBS Ambassador — logo, marques, contenus, textes, interfaces, code source, base de données — est la propriété exclusive du Groupe SBBS. Toute reproduction, représentation, modification ou exploitation non autorisée est strictement interdite et constitue une contrefaçon.`,
  },
  {
    id: 9,
    title: "Article 9 — Suspension et Résiliation",
    content: `La direction du Groupe SBBS se réserve le droit de suspendre ou de résilier l'accès d'un utilisateur à l'application sans préavis en cas de :

• Violation des présentes CGU ;
• Comportement frauduleux ou déloyal envers SBBS ou ses clients ;
• Inactivité prolongée sans justification valable ;
• Décision de la direction pour des raisons légitimes d'ordre organisationnel.`,
  },
  {
    id: 10,
    title: "Article 10 — Limitation de Responsabilité",
    content: `Le Groupe SBBS ne saurait être tenu responsable des dommages directs ou indirects résultant d'une interruption temporaire de service, d'une perte de données due à un événement de force majeure, ou d'une utilisation non conforme de l'application par l'utilisateur.`,
  },
  {
    id: 11,
    title: "Article 11 — Modification des CGU",
    content: `Le Groupe SBBS se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication dans l'application. L'utilisateur sera notifié par message dans l'application. La poursuite de l'utilisation après notification vaut acceptation des nouvelles conditions.`,
  },
  {
    id: 12,
    title: "Article 12 — Droit Applicable et Juridiction Compétente",
    content: `Les présentes CGU sont régies par le droit ivoirien. En cas de litige relatif à leur interprétation ou exécution, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux compétents d'Abidjan, Côte d'Ivoire, seront seuls compétents.`,
  },
];

export default function CGUPage() {
  const router = useRouter();
  const [openSection, setOpenSection] = useState<number | null>(1);

  return (
    <div className="min-h-screen pb-10" style={{ background: '#F0F2F5' }}>

      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-3 shadow-lg sticky top-0 z-10"
        style={{ background: 'linear-gradient(135deg, #1A3A6C 0%, #2563EB 100%)' }}>
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white text-sm transition">
          ← Retour
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-white text-sm">Conditions Générales d'Utilisation</h1>
          <p className="text-xs text-blue-200">SBBS Ambassador · Version 1.0 · Mai 2026</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* Intro card */}
        <div className="rounded-2xl p-5 mb-6 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #1A3A6C, #2563EB)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(201,168,76,0.2)' }}>📋</div>
            <div>
              <p className="font-bold text-white text-sm">Salomon Betsaleel Business School</p>
              <p className="text-xs" style={{ color: '#C9A84C' }}>Intelligence et Expertise des Affaires</p>
            </div>
          </div>
          <p className="text-xs text-blue-100 leading-relaxed">
            En utilisant l'application SBBS Ambassador, vous acceptez les présentes conditions générales d'utilisation.
            Veuillez les lire attentivement.
          </p>
        </div>

        {/* Sections accordion */}
        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                className="w-full px-4 py-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1A3A6C, #2563EB)' }}>
                    {section.id}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: '#1A3A6C' }}>
                    {section.title}
                  </span>
                </div>
                <span className="text-gray-400 text-lg ml-2">
                  {openSection === section.id ? '−' : '+'}
                </span>
              </button>

              {openSection === section.id && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-3">
                    {section.content.split('\n').map((line, i) => (
                      <p key={i} className={`text-sm leading-relaxed ${
                        line.startsWith('•') ? 'pl-4 text-gray-600 mb-1' :
                        line.match(/^\d+\./) ? 'font-semibold text-gray-800 mt-3 mb-1' :
                        line === '' ? 'mb-2' : 'text-gray-700 mb-2'
                      }`}>
                        {line || '\u00A0'}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-6 rounded-2xl p-5 shadow-sm" style={{ background: 'white' }}>
          <p className="font-bold text-sm mb-3" style={{ color: '#1A3A6C' }}>📞 Contact et Réclamations</p>
          <p className="text-xs text-gray-600 mb-1">Siège : Cocody – Riviera 4 – Cité Terre Afrique, Abidjan</p>
          <p className="text-xs text-gray-600 mb-1">Tél : +225 07 09 20 61 81 / 07 08 76 18 40</p>
          <p className="text-xs text-gray-600">Email : mde@intelligentpartnership.net</p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Salomon Betsaleel Business School — Groupe Intelligent Partnership
        </p>
      </div>
    </div>
  );
}
