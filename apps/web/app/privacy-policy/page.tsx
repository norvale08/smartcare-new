'use client'

import React, { useState } from 'react'
import { Shield, Lock, Database, Users, Bell, Activity, FileText, ChevronDown, ChevronUp, Globe } from 'lucide-react'

const PrivacyPolicyPage = () => {
  const [language, setLanguage] = useState<'en' | 'sw'>('en')
  const [expandedSections, setExpandedSections] = useState<string[]>(['data-collection'])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const content = {
    en: {
      title: "Privacy Policy & Data Consent",
      subtitle: "Understanding Your Health Data",
      lastUpdated: "Last Updated: January 2026",
      intro: "At SmartCare, we are committed to protecting your privacy and ensuring the security of your health information. This policy explains how we collect, use, store, and protect your data.",
      sections: [
        {
          id: 'data-collection',
          icon: Database,
          title: "What Data We Collect",
          content: [
            {
              subtitle: "Personal Information",
              items: [
                "Name (First and Last Name)",
                "Email address",
                "Phone number",
                "Date of birth",
                "Gender",
                "Physical measurements (height, weight)"
              ]
            },
            {
              subtitle: "Health Information",
              items: [
                "Medical conditions (Diabetes, Hypertension, Cardiovascular)",
                "Health vitals (blood pressure, glucose levels, heart rate)",
                "Medication information",
                "Allergies and medical history",
                "Previous surgeries and procedures",
                "Emergency contact information"
              ]
            },
            {
              subtitle: "Monitoring Data",
              items: [
                "Real-time health readings from connected devices",
                "Location data (for emergency response only)",
                "Activity patterns and health trends",
                "Doctor-patient communication records",
                "Appointment and consultation history"
              ]
            }
          ]
        },
        {
          id: 'data-usage',
          icon: Activity,
          title: "How We Use Your Data",
          content: [
            {
              subtitle: "Primary Uses",
              items: [
                "24/7 continuous health monitoring and tracking",
                "AI-powered anomaly detection for early warning of health issues",
                "Personalized health recommendations and care plans",
                "Emergency alert system for hospitals and emergency medical technicians",
                "Connecting you with healthcare providers and specialists",
                "Generating health reports and trend analysis"
              ]
            },
            {
              subtitle: "Secondary Uses",
              items: [
                "Improving our AI algorithms and detection accuracy",
                "Research and development (anonymized data only)",
                "System performance optimization",
                "Compliance with legal and regulatory requirements"
              ]
            }
          ]
        },
        {
          id: 'data-storage',
          icon: Lock,
          title: "How We Store Your Data",
          content: [
            {
              subtitle: "Security Measures",
              items: [
                "End-to-end encryption for all data transmission",
                "Secure cloud storage with industry-standard encryption",
                "Regular security audits and vulnerability assessments",
                "Multi-factor authentication for account access",
                "Automatic logout after periods of inactivity",
                "Encrypted backups with disaster recovery protocols"
              ]
            },
            {
              subtitle: "Data Retention",
              items: [
                "Active health data: Retained while your account is active",
                "Historical records: Kept for 7 years for medical reference",
                "Anonymized research data: May be retained indefinitely",
                "Deleted accounts: Data permanently removed within 90 days"
              ]
            }
          ]
        },
        {
          id: 'data-sharing',
          icon: Users,
          title: "Who Can Access Your Data",
          content: [
            {
              subtitle: "Direct Access",
              items: [
                "You (full access to all your data)",
                "Your assigned doctors (health records and monitoring data)",
                "Emergency medical personnel (during emergencies only)",
                "Designated relatives/caregivers (with your permission)"
              ]
            },
            {
              subtitle: "Limited Access",
              items: [
                "SmartCare support team (for technical assistance only)",
                "AI systems (automated processing for health monitoring)",
                "Legal authorities (only when legally required)"
              ]
            },
            {
              subtitle: "No Access Without Consent",
              items: [
                "We NEVER sell your data to third parties",
                "We NEVER share data with advertisers",
                "We NEVER use your data for marketing without permission"
              ]
            }
          ]
        },
        {
          id: 'your-rights',
          icon: Shield,
          title: "Your Rights",
          content: [
            {
              subtitle: "You Have the Right To",
              items: [
                "Access all your personal and health data at any time",
                "Request corrections to inaccurate information",
                "Download your complete health records",
                "Delete your account and all associated data",
                "Withdraw consent for data processing",
                "Restrict certain types of data collection",
                "Object to automated decision-making",
                "Request human review of AI-generated alerts"
              ]
            }
          ]
        },
        {
          id: 'emergency',
          icon: Bell,
          title: "Emergency Response & Data Sharing",
          content: [
            {
              subtitle: "During Medical Emergencies",
              items: [
                "Critical health data automatically shared with emergency services",
                "Location data transmitted to enable rapid response",
                "Medical history shared with responding healthcare providers",
                "Emergency contacts notified immediately",
                "All emergency data sharing is logged for your review"
              ]
            }
          ]
        },
        {
          id: 'consent',
          icon: FileText,
          title: "Your Consent",
          content: [
            {
              subtitle: "By Using SmartCare, You Agree To",
              items: [
                "Collection and processing of your health data as described",
                "AI-powered analysis of your health information",
                "Sharing data with assigned healthcare providers",
                "Emergency data sharing during critical situations",
                "Use of anonymized data for research and improvement"
              ]
            },
            {
              subtitle: "You Can Withdraw Consent",
              items: [
                "At any time through your account settings",
                "By contacting our support team",
                "Note: Withdrawal may limit some SmartCare features"
              ]
            }
          ]
        }
      ],
      contact: {
        title: "Questions or Concerns?",
        content: "If you have any questions about this privacy policy or how we handle your data, please contact us at:",
        email: "privacy@smartcare.health",
        phone: "+254 700 000 000"
      }
    },
    sw: {
      title: "Sera ya Faragha na Idhini ya Data",
      subtitle: "Kuelewa Data Yako ya Afya",
      lastUpdated: "Imesasishwa Mwisho: Januari 2026",
      intro: "Katika SmartCare, tumejitolea kulinda faragha yako na kuhakikisha usalama wa taarifa zako za afya. Sera hii inaelezea jinsi tunavyokusanya, kutumia, kuhifadhi, na kulinda data yako.",
      sections: [
        {
          id: 'data-collection',
          icon: Database,
          title: "Data Tunazokusanya",
          content: [
            {
              subtitle: "Taarifa za Kibinafsi",
              items: [
                "Jina (Jina la Kwanza na la Mwisho)",
                "Anwani ya barua pepe",
                "Nambari ya simu",
                "Tarehe ya kuzaliwa",
                "Jinsia",
                "Vipimo vya kimwili (urefu, uzito)"
              ]
            },
            {
              subtitle: "Taarifa za Afya",
              items: [
                "Hali za kiafya (Kisukari, Shinikizo la Damu, Moyo)",
                "Ishara za afya (shinikizo la damu, viwango vya glukosi, mapigo ya moyo)",
                "Taarifa za dawa",
                "Mzio na historia ya matibabu",
                "Upasuaji na taratibu za awali",
                "Taarifa za mawasiliano ya dharura"
              ]
            },
            {
              subtitle: "Data ya Ufuatiliaji",
              items: [
                "Usomaji wa afya wa wakati halisi kutoka vifaa vilivyounganishwa",
                "Data ya eneo (kwa ajili ya majibu ya dharura tu)",
                "Mifumo ya shughuli na mwelekeo wa afya",
                "Rekodi za mawasiliano ya daktari-mgonjwa",
                "Historia ya miadi na ushauri"
              ]
            }
          ]
        },
        {
          id: 'data-usage',
          icon: Activity,
          title: "Jinsi Tunavyotumia Data Yako",
          content: [
            {
              subtitle: "Matumizi ya Msingi",
              items: [
                "Ufuatiliaji wa afya wa saa 24/7",
                "Ugunduzi wa AI wa mambo yasiyokuwa ya kawaida kwa onyo la mapema",
                "Mapendekezo ya kibinafsi ya afya na mipango ya huduma",
                "Mfumo wa tahadhari ya dharura kwa hospitali na wataalamu wa dharura",
                "Kukuunganisha na watoa huduma za afya na wataalam",
                "Kutengeneza ripoti za afya na uchambuzi wa mwenendo"
              ]
            },
            {
              subtitle: "Matumizi ya Pili",
              items: [
                "Kuboresha algorithms zetu za AI na usahihi wa kugundua",
                "Utafiti na maendeleo (data isiyojulikana tu)",
                "Uboreshaji wa utendaji wa mfumo",
                "Kuzingatia mahitaji ya kisheria na ya udhibiti"
              ]
            }
          ]
        },
        {
          id: 'data-storage',
          icon: Lock,
          title: "Jinsi Tunavyohifadhi Data Yako",
          content: [
            {
              subtitle: "Hatua za Usalama",
              items: [
                "Usimbaji fiche wa mwisho hadi mwisho kwa usambazaji wote wa data",
                "Uhifadhi salama wa wingu na usimbaji fiche wa kiwango cha sekta",
                "Ukaguzi wa usalama wa kawaida na tathmini za udhaifu",
                "Uthibitishaji wa mambo mengi kwa ufikiaji wa akaunti",
                "Kutoka kiotomatiki baada ya vipindi vya kutokuwa hai",
                "Nakala zilizosimbwa kwa itifaki za kurejesha msiba"
              ]
            },
            {
              subtitle: "Uhifadhi wa Data",
              items: [
                "Data ya afya hai: Imehifadhiwa wakati akaunti yako iko hai",
                "Rekodi za kihistoria: Zimewekwa kwa miaka 7 kwa kumbukumbu za kimatibabu",
                "Data ya utafiti isiyojulikana: Inaweza kuhifadhiwa bila kikomo",
                "Akaunti zilizofutwa: Data imeondolewa kabisa ndani ya siku 90"
              ]
            }
          ]
        },
        {
          id: 'data-sharing',
          icon: Users,
          title: "Nani Anaweza Kufikia Data Yako",
          content: [
            {
              subtitle: "Ufikiaji wa Moja kwa Moja",
              items: [
                "Wewe (ufikiaji kamili kwa data yako yote)",
                "Madaktari wako waliokabdhiwa (rekodi za afya na data ya ufuatiliaji)",
                "Wafanyakazi wa dharura za matibabu (wakati wa dharura tu)",
                "Jamaa/walezi waliochaguliwa (kwa ruhusa yako)"
              ]
            },
            {
              subtitle: "Ufikiaji Mdogo",
              items: [
                "Timu ya msaada ya SmartCare (kwa usaidizi wa kiufundi tu)",
                "Mifumo ya AI (usindikaji wa kiotomatiki kwa ufuatiliaji wa afya)",
                "Mamlaka za kisheria (tu wanapohitajika kisheria)"
              ]
            },
            {
              subtitle: "Hakuna Ufikiaji Bila Idhini",
              items: [
                "KAMWE hatuuzi data yako kwa wahusika wengine",
                "KAMWE hatushiriki data na watangazaji",
                "KAMWE hatutatumia data yako kwa masoko bila ruhusa"
              ]
            }
          ]
        },
        {
          id: 'your-rights',
          icon: Shield,
          title: "Haki Zako",
          content: [
            {
              subtitle: "Una Haki Ya",
              items: [
                "Kufikia data yako yote ya kibinafsi na ya afya wakati wowote",
                "Kuomba marekebisho kwa taarifa zisizo sahihi",
                "Kupakua rekodi zako kamili za afya",
                "Kufuta akaunti yako na data zote zinazohusiana",
                "Kuondoa idhini ya usindikaji wa data",
                "Kuzuia aina fulani za ukusanyaji wa data",
                "Kupinga uamuzi wa kiotomatiki",
                "Kuomba ukaguzi wa kibinadamu wa tahadhari zilizozalishwa na AI"
              ]
            }
          ]
        },
        {
          id: 'emergency',
          icon: Bell,
          title: "Majibu ya Dharura na Kushiriki Data",
          content: [
            {
              subtitle: "Wakati wa Dharura za Kimatibabu",
              items: [
                "Data muhimu ya afya inashirikiwa kiotomatiki na huduma za dharura",
                "Data ya eneo inapelekwa ili kuwezesha majibu ya haraka",
                "Historia ya matibabu inashirikiwa na watoa huduma wa afya wanaojibu",
                "Mawasiliano ya dharura yanajulishwa mara moja",
                "Ushiriki wote wa data ya dharura unarekodiwa kwa ukaguzi wako"
              ]
            }
          ]
        },
        {
          id: 'consent',
          icon: FileText,
          title: "Idhini Yako",
          content: [
            {
              subtitle: "Kwa Kutumia SmartCare, Unakubali",
              items: [
                "Ukusanyaji na usindikaji wa data yako ya afya kama ilivyoelezwa",
                "Uchambuzi unaotumia AI wa taarifa zako za afya",
                "Kushiriki data na watoa huduma wa afya waliokabdhiwa",
                "Kushiriki data ya dharura wakati wa hali muhimu",
                "Matumizi ya data isiyojulikana kwa utafiti na uboreshaji"
              ]
            },
            {
              subtitle: "Unaweza Kuondoa Idhini",
              items: [
                "Wakati wowote kupitia mipangilio ya akaunti yako",
                "Kwa kuwasiliana na timu yetu ya msaada",
                "Kumbuka: Kuondoa kunaweza kupunguza baadhi ya vipengele vya SmartCare"
              ]
            }
          ]
        }
      ],
      contact: {
        title: "Maswali au Masuala?",
        content: "Ikiwa una maswali yoyote kuhusu sera hii ya faragha au jinsi tunavyoshughulikia data yako, tafadhali wasiliana nasi kwa:",
        email: "privacy@smartcare.health",
        phone: "+254 700 000 000"
      }
    }
  }

  const currentContent = content[language]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {currentContent.title}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  {currentContent.lastUpdated}
                </p>
              </div>
            </div>
            <button
              onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'en' ? 'Kiswahili' : 'English'}</span>
              <span className="sm:hidden">{language === 'en' ? 'SW' : 'EN'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            {currentContent.subtitle}
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {currentContent.intro}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {currentContent.sections.map((section) => {
            const Icon = section.icon
            const isExpanded = expandedSections.includes(section.id)

            return (
              <div key={section.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 text-left">
                      {section.title}
                    </h3>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 space-y-6">
                    {section.content.map((item, idx) => (
                      <div key={idx}>
                        {item.subtitle && (
                          <h4 className="font-semibold text-gray-900 mb-3 text-base">
                            {item.subtitle}
                          </h4>
                        )}
                        <ul className="space-y-2">
                          {item.items.map((point, pointIdx) => (
                            <li key={pointIdx} className="flex items-start gap-2 text-gray-700">
                              <span className="text-blue-600 mt-1.5 flex-shrink-0">•</span>
                              <span className="text-sm sm:text-base">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl shadow-md p-6 sm:p-8 mt-6 text-white">
          <h3 className="text-xl font-bold mb-3">{currentContent.contact.title}</h3>
          <p className="mb-4 text-blue-50">{currentContent.contact.content}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{language === 'en' ? 'Email:' : 'Barua Pepe:'}</span>
              <a href={`mailto:${currentContent.contact.email}`} className="underline hover:text-blue-200">
                {currentContent.contact.email}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{language === 'en' ? 'Phone:' : 'Simu:'}</span>
              <a href={`tel:${currentContent.contact.phone}`} className="underline hover:text-blue-200">
                {currentContent.contact.phone}
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>© 2026 SmartCare. {language === 'en' ? 'All rights reserved.' : 'Haki zote zimehifadhiwa.'}</p>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage