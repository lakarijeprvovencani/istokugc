import type { Metadata } from 'next';
import LegalPage, { Section, P, UL, H3 } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'GDPR informacije | UGC Executive',
  description: 'Tvoja prava prema Opštoj uredbi EU o zaštiti podataka (GDPR).',
};

export default function GdprPage() {
  return (
    <LegalPage
      title="GDPR informacije"
      lastUpdated="5. maj 2026."
      intro={
        'Iako je naša firma registrovana u Sjedinjenim Američkim Državama (Wyoming), ' +
        'mnogi naši korisnici dolaze iz Evropske Unije. Zato dobrovoljno poštujemo ' +
        'pravila Opšte uredbe EU o zaštiti podataka (GDPR, 2016/679) za sve naše ' +
        'korisnike. Ovaj dokument sažima tvoja prava i postupak za njihovo ostvarivanje.'
      }
    >
      <Section id="kontroler" title="1. Kontrolor podataka">
        <P>
          Kontrolor tvojih podataka u smislu GDPR-a je{' '}
          <strong>Minnie Downtown Media LLC</strong>, registrovan u državi Wyoming, SAD.
          Naša puna kontakt adresa i email su navedeni u{' '}
          <a href="/politika-privatnosti" className="text-primary hover:underline">
            Politici privatnosti
          </a>
          .
        </P>
        <P>
          Iako nismo zakonski obavezni da imenujemo Predstavnika u EU prema članu
          27 GDPR-a (zbog veličine i prirode obrade), možeš nam se uvek obratiti
          direktno na{' '}
          <a href="mailto:hello@ugcexecutive.com" className="text-primary hover:underline">
            hello@ugcexecutive.com
          </a>
          .
        </P>
      </Section>

      <Section id="prava" title="2. Tvoja GDPR prava">
        <P>Kao korisnik iz EU (ili države sa GDPR-ekvivalentnim zakonom) imaš:</P>

        <H3>Pravo na pristup (član 15)</H3>
        <P>
          Možeš zatražiti potvrdu da li obrađujemo podatke o tebi i, ako da, kopiju
          tih podataka u strukturiranom formatu. Odgovaramo u roku od 30 dana.
        </P>

        <H3>Pravo na ispravku (član 16)</H3>
        <P>
          Većinu podataka možeš sam ispraviti kroz panel <em>Podešavanja</em>. Za
          podatke koje ne možeš sam menjati, piši nam na{' '}
          <a href="mailto:hello@ugcexecutive.com" className="text-primary hover:underline">
            hello@ugcexecutive.com
          </a>
          .
        </P>

        <H3>Pravo na brisanje („pravo na zaborav“, član 17)</H3>
        <P>
          Možeš zatražiti potpuno brisanje tvog naloga i podataka. Brisanje ćemo
          izvršiti u roku od 30 dana, izuzev podataka koje smo zakonski obavezni
          da čuvamo (npr. računi za poreske svrhe — do 10 godina).
        </P>

        <H3>Pravo na ograničenje obrade (član 18)</H3>
        <P>
          Možeš tražiti da privremeno zaustavimo obradu tvojih podataka, npr. dok
          se rešava prigovor.
        </P>

        <H3>Pravo na prenosivost (član 20)</H3>
        <P>
          Možeš tražiti kopiju svojih podataka u mašinski-čitljivom formatu (JSON
          ili CSV) kako bi ih preneo drugom servisu.
        </P>

        <H3>Pravo na prigovor (član 21)</H3>
        <P>
          Možeš se usprotiviti obradi koja se zasniva na našem legitimnom
          interesu. U tom slučaju ćemo prestati sa obradom osim ako imamo prevažan
          legitimni razlog koji nadjačava tvoja prava.
        </P>

        <H3>Pravo na povlačenje saglasnosti</H3>
        <P>
          Tamo gde je obrada zasnovana na saglasnosti (npr. newsletter), možeš
          povući saglasnost u svako doba bez ikakvog uticaja na zakonitost ranije
          obrade.
        </P>

        <H3>Pravo na žalbu nadzornom organu</H3>
        <P>
          Ako smatraš da kršimo tvoja prava, možeš se žaliti nadzornom organu u
          tvojoj zemlji:
        </P>
        <UL>
          <li>
            <strong>Srbija</strong> — Poverenik za informacije od javnog značaja i
            zaštitu podataka o ličnosti (
            <a
              href="https://www.poverenik.rs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              poverenik.rs
            </a>
            )
          </li>
          <li>
            <strong>Hrvatska</strong> — Agencija za zaštitu osobnih podataka
            (AZOP,{' '}
            <a
              href="https://azop.hr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              azop.hr
            </a>
            )
          </li>
          <li>
            <strong>BiH</strong> — Agencija za zaštitu ličnih podataka (AZLP,{' '}
            <a
              href="https://azlp.ba"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              azlp.ba
            </a>
            )
          </li>
          <li>
            <strong>Slovenija</strong> — Informacijski pooblaščenec (
            <a
              href="https://www.ip-rs.si"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              ip-rs.si
            </a>
            )
          </li>
        </UL>
      </Section>

      <Section id="kako" title="3. Kako da ostvariš svoja prava">
        <P>Pošalji nam email na adresu:</P>
        <P>
          <a
            href="mailto:hello@ugcexecutive.com"
            className="text-primary hover:underline text-lg"
          >
            hello@ugcexecutive.com
          </a>
        </P>
        <P>U porukama, navedi:</P>
        <UL>
          <li>email adresu sa kojom si registrovan na Platformi;</li>
          <li>tačno koje pravo želiš da iskoristiš;</li>
          <li>
            (po potrebi) razumno potvrđivanje identiteta — npr. odgovor sa
            registrovane email adrese.
          </li>
        </UL>
        <P>
          Odgovor ti šaljemo u roku od <strong>30 dana</strong>. Usluga je{' '}
          <strong>besplatna</strong>, osim ako su tvoji zahtevi očigledno
          neosnovani ili preterani (npr. više identičnih zahteva u kratkom roku),
          u kom slučaju možemo naplatiti razumnu administrativnu naknadu ili
          odbiti zahtev uz obrazloženje.
        </P>
      </Section>

      <Section id="prenos" title="4. Prenos podataka u SAD">
        <P>
          Pošto je naša firma u SAD, a deo naših obrađivača takođe (Stripe,
          Vercel, Cloudflare), tvoji podaci se mogu prenositi izvan EU. Sve takve
          prenose vršimo uz odgovarajuće zaštitne mere predviđene GDPR-om:
        </P>
        <UL>
          <li>
            naše obrađivače biramo iz reda firmi koje su <strong>certifikovane</strong>{' '}
            pod EU-US Data Privacy Framework (DPF), tamo gde je to moguće;
          </li>
          <li>
            sa svim obrađivačima imamo potpisane <strong>Standardne ugovorne
            klauzule</strong> (SCC) odobrene od strane Evropske komisije;
          </li>
          <li>
            podaci u našoj glavnoj bazi (Supabase) se primarno čuvaju u EU regionu
            (Frankfurt/Zürich).
          </li>
        </UL>
      </Section>

      <Section id="dpo" title="5. Kontakt za zaštitu podataka">
        <P>
          Nismo zakonski obavezni da imenujemo formalnog Službenika za zaštitu
          podataka (DPO), ali svi GDPR upiti se direktno obrađuju od strane našeg
          tima na adresi{' '}
          <a href="mailto:hello@ugcexecutive.com" className="text-primary hover:underline">
            hello@ugcexecutive.com
          </a>
          .
        </P>
      </Section>
    </LegalPage>
  );
}
