import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Grid,
  Layers,
  Shield,
  Printer,
  Wand2,
  Eye,
  Compass,
  Award,
} from 'lucide-react';
import { CardRenderer } from '../components/CardRenderer';
import {
  GeorgianCornerOrnament,
  GeorgianOrnamentDivider,
} from '../components/GeorgianOrnaments';
import {
  ILLUSTRATION_STYLES,
  PlayingCard,
} from '../../shared/types';
import { INITIAL_DEMO_CARDS } from '../../shared/demoData';

export const HomePage: React.FC<{
  cards: PlayingCard[];
  onSelectCardForEdit: (card: PlayingCard) => void;
}> = ({ cards, onSelectCardForEdit }) => {
  const navigate = useNavigate();
  const [showCardBackHero, setShowCardBackHero] = useState(false);

  const heroCards = (cards.length >= 4 ? cards : INITIAL_DEMO_CARDS).slice(0, 4);

  return (
    <div>
      {/* ====================================================================
          A.1 Cinematic Hero Section featuring actual Georgian Playing Cards
         ==================================================================== */}
      <section
        style={{
          position: 'relative',
          padding: '4.5rem 0 5rem',
          overflow: 'hidden',
          borderBottom: 'var(--border-gold-thin)',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '3.25rem',
              alignItems: 'center',
            }}
          >
            {/* Left Column: Georgian Cultural Headline & Actions */}
            <div>
              <div style={{ marginBottom: '1.15rem' }}>
                <span className="badge badge-gold">
                  <Sparkles size={13} />
                  <span>ქართული ორნამენტული ხელოვნება და AI სტუდია</span>
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2.25rem, 4.5vw, 3.6rem)',
                  lineHeight: 1.15,
                  marginBottom: '1.25rem',
                  color: 'var(--color-ivory)',
                }}
              >
                ქართული ბანქო, შენი დიზაინით
              </h1>

              <p
                style={{
                  fontSize: '1.08rem',
                  color: 'var(--color-ivory-muted)',
                  marginBottom: '2rem',
                  maxWidth: '560px',
                  lineHeight: 1.75,
                }}
              >
                შექმენით ორიგინალური სათამაშო კარტები და სრული კოლექციური დასტები,
                შთაგონებული ქართული კულტურული მემკვიდრეობით, ტიხრული მინანქრით,
                ტაძართა ჩუქურთმებით, ისტორიული სამოსითა და ფოლკლორით.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '2.25rem',
                }}
              >
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate('/generator')}
                >
                  <Wand2 size={19} />
                  <span>დიზაინის შექმნა</span>
                </button>

                <button
                  className="btn btn-gold btn-lg"
                  onClick={() => navigate('/generator?mode=photo')}
                >
                  <Sparkles size={19} />
                  <span>ფოტოს ატვირთვა და დიზაინი</span>
                </button>

                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => navigate('/gallery')}
                >
                  <Grid size={19} />
                  <span>გალერეის ნახვა</span>
                </button>
              </div>

              {/* Studio Metrics Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  paddingTop: '1.5rem',
                  borderTop: 'var(--border-gold-thin)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      color: 'var(--color-gold)',
                    }}
                  >
                    36 / 52+
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-stone)' }}>
                    სრული დასტის კონფიგურაცია
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      color: 'var(--color-gold)',
                    }}
                  >
                    100% SVG
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-stone)' }}>
                    ზუსტი ვექტორული ჩარჩო და ინდექსი
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      color: 'var(--color-gold)',
                    }}
                  >
                    300 DPI PDF
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-stone)' }}>
                    სტამბური ბეჭდვის ფორმატი
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Showcase of Real Georgian Playing Cards */}
            <div
              className="luxury-panel"
              style={{
                padding: '2.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background:
                  'radial-gradient(circle at 50% 45%, rgba(114, 47, 55, 0.35) 0%, rgba(21, 21, 21, 0.95) 75%)',
              }}
            >
              <GeorgianCornerOrnament
                size={38}
                position="top-left"
                style={{ position: 'absolute', top: 10, left: 10 }}
              />
              <GeorgianCornerOrnament
                size={38}
                position="top-right"
                style={{ position: 'absolute', top: 10, right: 10 }}
              />
              <GeorgianCornerOrnament
                size={38}
                position="bottom-left"
                style={{ position: 'absolute', bottom: 10, left: 10 }}
              />
              <GeorgianCornerOrnament
                size={38}
                position="bottom-right"
                style={{ position: 'absolute', bottom: 10, right: 10 }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: ' center',
                  gap: '1.25rem',
                  flexWrap: 'wrap',
                  marginBottom: '1.5rem',
                }}
              >
                {heroCards.slice(0, 2).map((card) => (
                  <div
                    key={card.id}
                    className="card-showcase-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      onSelectCardForEdit(card);
                      navigate('/editor');
                    }}
                    title="დააწკაპუნეთ რედაქტორში გასახსნელად"
                  >
                    <CardRenderer
                      id={`hero-${card.id}`}
                      rank={card.rank}
                      suit={card.suit}
                      illustrationUrl={card.illustrationUrl}
                      designSpec={card.designSpec}
                      titleKa={card.titleKa}
                      isCardBack={showCardBackHero}
                      scale={0.76}
                    />
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowCardBackHero((prev) => !prev)}
                >
                  <Eye size={15} />
                  <span>
                    {showCardBackHero
                      ? 'წინა მხარის ჩვენება'
                      : 'ბანქოს ზურგის (უკანა მხარის) ნახვა'}
                  </span>
                </button>
                <span className="badge badge-demo">
                  ნიმუში: ბაგრატიონთა სამეფო სერია
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          A.2 Visual Showcase of Original Georgian-Inspired Playing Cards
         ==================================================================== */}
      <section style={{ padding: '4.5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
            <span className="badge badge-wine" style={{ marginBottom: '0.75rem' }}>
              საავტორო ნიმუშები
            </span>
            <h2 style={{ fontSize: '2.1rem', marginBottom: '0.6rem' }}>
              ქართული ბანქოს ვიზუალური ვიტრინა
            </h2>
            <p style={{ color: 'var(--color-stone)', maxWidth: '640px', margin: '0 auto' }}>
              თითოეული კარტი აერთიანებს Gemini-ით გენერირებულ უნიკალურ ცენტრალურ ილუსტრაციასა
              და ზუსტ ვექტორულ (SVG) ქართულ ორნამენტულ ჩარჩოს.
            </p>
            <GeorgianOrnamentDivider />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))',
              gap: '1.75rem',
              justifyItems: 'center',
            }}
          >
            {heroCards.map((card) => (
              <div
                key={card.id}
                className="luxury-panel card-showcase-item"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <CardRenderer
                  id={`showcase-${card.id}`}
                  rank={card.rank}
                  suit={card.suit}
                  illustrationUrl={card.illustrationUrl}
                  designSpec={card.designSpec}
                  titleKa={card.titleKa}
                  scale={0.75}
                />

                <div style={{ marginTop: '1rem', textAlign: 'center', width: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <span className="badge badge-demo">
                      {card.isDemo ? 'დემო ნიმუში' : 'AI გენერირებული'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.3rem' }}>
                    {card.titleKa}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--color-stone)',
                      marginBottom: '0.9rem',
                      minHeight: '2.6rem',
                    }}
                  >
                    {card.subjectDescription}
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => {
                      onSelectCardForEdit(card);
                      navigate('/editor');
                    }}
                  >
                    რედაქტორში გახსნა
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          A.3 How the Generator Works (როგორ მუშაობს გენერატორი)
         ==================================================================== */}
      <section
        style={{
          padding: '4.5rem 0',
          background: 'rgba(26, 20, 22, 0.7)',
          borderTop: 'var(--border-gold-thin)',
          borderBottom: 'var(--border-gold-thin)',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              როგორ მუშაობს Kartuli Deck AI
            </h2>
            <p style={{ color: 'var(--color-stone)' }}>
              ოთხი ნაბიჯი იდეიდან სტამბურად გამზადებულ ქართულ დასტამდე
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {[
              {
                step: '01',
                title: 'სტილისა და მოტივის შერჩევა',
                desc: 'აირჩიეთ ტიხრული მინანქარი, ხელნაწერი მინიატურა ან ქვაზე კვეთილი რელიეფი, ფერთა პალიტრა და ქართული ორნამენტი.',
                icon: <Compass size={22} color="var(--color-gold)" />,
              },
              {
                step: '02',
                title: 'Gemini AI ილუსტრაციის გენერაცია',
                desc: 'სისტემა აყალიბებს დასტის ერთიან სტილის სპეციფიკაციას და Gemini Nano Banana 2.1 მოდელით ქმნის თითოეულ კარტს.',
                icon: <Sparkles size={22} color="var(--color-gold)" />,
              },
              {
                step: '03',
                title: 'SVG ჩარჩოსა და ინდექსების მორგება',
                desc: 'კარტის რედაქტორში შეცვალეთ კუთხის ორნამენტები, შრიფტი, ჩარჩოს სისქე და სიმბოლოები ილუსტრაციის ხელახალი გენერაციის გარეშე.',
                icon: <Layers size={22} color="var(--color-gold)" />,
              },
              {
                step: '04',
                title: 'PNG, SVG და საბეჭდი PDF ექსპორტი',
                desc: 'ჩამოტვირთეთ ცალკეული კარტები ან მრავალგვერდიანი საბეჭდი PDF ზუსტი ზომებით, ჭრის ნიშნებითა (Crop Marks) და Bleed-ით.',
                icon: <Printer size={22} color="var(--color-gold)" />,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="luxury-panel"
                style={{ padding: '1.75rem' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                  }}
                >
                  <span
                    className="brand-wordmark"
                    style={{ fontSize: '1.4rem', color: 'var(--color-gold)' }}
                  >
                    {item.step}
                  </span>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '1.12rem', marginBottom: '0.6rem' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-stone)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          A.4 Gallery of Possible Design Styles (დიზაინის სტილების გალერეა)
         ==================================================================== */}
      <section style={{ padding: '4.5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              ქართული მხატვრული სტილები
            </h2>
            <p style={{ color: 'var(--color-stone)' }}>
              სპეციალურად დამუშავებული ვიზუალური მიმართულებები ერთიანი დასტის სტილისთვის
            </p>
            <GeorgianOrnamentDivider />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {ILLUSTRATION_STYLES.map((style) => (
              <div
                key={style.id}
                className="luxury-panel"
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>
                    მხატვრული მიმართულება
                  </span>
                  <h3 style={{ fontSize: '1.18rem', marginBottom: '0.65rem' }}>
                    {style.nameKa}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--color-stone)',
                      marginBottom: '1.25rem',
                    }}
                  >
                    {style.descriptionKa}
                  </p>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/generator?style=${style.id}`)}
                >
                  ამ სტილით შექმნა
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          A.5 Platform Benefits (პლატფორმის უპირატესობები)
         ==================================================================== */}
      <section style={{ padding: '2rem 0 4rem' }}>
        <div className="container">
          <div
            className="luxury-panel"
            style={{
              padding: '3rem 2rem',
              background:
                'linear-gradient(135deg, rgba(53, 26, 34, 0.92) 0%, rgba(21, 21, 21, 0.96) 100%)',
              borderColor: 'var(--color-gold)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '2rem',
              }}
            >
              <div>
                <Award size={28} color="var(--color-gold)" style={{ marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
                  ავთენტური ქართული სიმბოლიკა
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-ivory-muted)' }}>
                  სტანდარტულ მასტებთან ერთად მხარდაჭერილია ქართული სიმბოლოები: ვაზი,
                  ხანჯალი და ბორჯღალი, ასევე ბერიკაობის ჯოკერი.
                </p>
              </div>

              <div>
                <Shield size={28} color="var(--color-gold)" style={{ marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
                  დეტერმინისტული კარტის რენდერი
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-ivory-muted)' }}>
                  AI არ ამახინჯებს კარტის ციფრებსა და ასოებს — ყველა ინდექსი, ჩარჩო და
                  კუთხის ორნამენტი იხატება ზუსტი SVG კომპონენტებით.
                </p>
              </div>

              <div>
                <Printer size={28} color="var(--color-gold)" style={{ marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
                  მზადაა სტამბაში დასაბეჭდად
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-ivory-muted)' }}>
                  ექსპორტის ცენტრი ამზადებს A4 / SRA3 ფურცლებზე განლაგებულ PDF ფაილებს
                  სტანდარტული 63×88 მმ ზომითა და Crop Marks ნიშნებით.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
