import type { Metadata } from 'next';
import LegalPage, { Section, P, UL, H3 } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Politika privatnosti | UGC Executive',
  description: 'Kako UGC Executive prikuplja, koristi i štiti tvoje podatke o ličnosti.',
};

export default function PolitikaPrivatnostiPage() {
  return (
    <LegalPage
      title="Politika privatnosti"
      lastUpdated="5. maj 2026."
      intro={
        'Tvoja privatnost nam je važna. Ovaj dokument objašnjava koje podatke o tebi ' +
        'prikupljamo, zašto ih prikupljamo, kako ih koristimo i kakve mogućnosti ' +
        'kontrole imaš nad tim podacima.'
      }
    >
      <Section id="kontroler" title="1. Ko upravlja tvojim podacima">
        <P>
          Kontrolor podataka u smislu ove politike je{' '}
          <strong>[NAZIV FIRME], LLC</strong>, Wyoming, SAD, sa sedištem na adresi{' '}
          <strong>[ADRESA FIRME]</strong>. Možeš nam se obratiti email-om na{' '}
          <a href="mailto:[CONTACT_EMAIL]" className="text-primary hover:underline">
            [CONTACT_EMAIL]
          </a>
          .
        </P>
      </Section>

      <Section id="koje-podatke" title="2. Koje podatke prikupljamo">
        <H3>2.1 Podaci koje sam unosiš</H3>
        <UL>
          <li>
            <strong>Pri registraciji:</strong> email adresa, lozinka (čuvamo samo
            kriptografski hash, nikad cleartext), ime i naziv firme.
          </li>
          <li>
            <strong>Profil Kreatora:</strong> ime, foto, biografija, kategorije,
            startna cena, linkovi na društvene mreže, portfolio sadržaj.
          </li>
          <li>
            <strong>Profil Biznisa:</strong> naziv firme, kontakt telefon, web
            sajt, industrija, opis.
          </li>
          <li>
            <strong>Komunikacija:</strong> kontakt poruke, prijave na poslove,
            komentari koje ostavljaš na Platformi.
          </li>
        </UL>

        <H3>2.2 Podaci koji se prikupljaju automatski</H3>
        <UL>
          <li>
            IP adresa, browser i operativni sistem, vreme prijave i pregledane
            stranice — koristimo radi sigurnosti i statistika.
          </li>
          <li>
            Cookies neophodni za rad sesije (Supabase Auth cookies). Ne koristimo
            third-party tracking ili reklamne kolačiće.
          </li>
        </UL>

        <H3>2.3 Podaci o plaćanju</H3>
        <P>
          Sve transakcije obrađuje <strong>Stripe, Inc.</strong>. Mi NE primamo i NE
          čuvamo brojeve kartica. Od Stripe-a dobijamo samo Customer ID i
          Subscription ID koji nam služe za upravljanje pretplatom. Stripe-ova
          politika privatnosti je dostupna na{' '}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            stripe.com/privacy
          </a>
          .
        </P>
      </Section>

      <Section id="zasto" title="3. Zašto i na osnovu čega obrađujemo podatke">
        <UL>
          <li>
            <strong>Izvršenje ugovora</strong> — kreiranje i održavanje naloga,
            prikazivanje Kreatora, naplata pretplate.
          </li>
          <li>
            <strong>Legitimni interes</strong> — sigurnost Platforme,
            sprečavanje prevara, poboljšanje funkcionalnosti.
          </li>
          <li>
            <strong>Pravna obaveza</strong> — čuvanje računa za poreske i
            računovodstvene svrhe.
          </li>
          <li>
            <strong>Saglasnost</strong> — opcioni newsletter ili obaveštenja o
            novostima (možeš se odjaviti u svako doba).
          </li>
        </UL>
      </Section>

      <Section id="ko-vidi" title="4. Ko ima pristup tvojim podacima">
        <UL>
          <li>
            <strong>Drugi Biznis korisnici</strong> mogu videti tvoj javni Kreator
            profil (ime, foto, kategorije, cenu, portfolio). Kontakt informacije
            (email, telefon) su dostupne SAMO Biznisima sa aktivnom pretplatom i
            samo onima sa kojima ti potvrdiš saradnju.
          </li>
          <li>
            <strong>Naš tim</strong> ima pristup podacima radi održavanja i
            podrške.
          </li>
          <li>
            <strong>Obrađivači</strong> sa kojima sarađujemo:
            <UL>
              <li>
                <strong>Supabase Inc.</strong> — hosting baze podataka i
                autentifikacije (servisi locirani u EU, region Frankfurt/Zürich).
              </li>
              <li>
                <strong>Stripe Inc.</strong> — obrada plaćanja (USA, certified
                under EU-US Data Privacy Framework).
              </li>
              <li>
                <strong>Cloudflare R2</strong> — skladištenje slika i video
                fajlova.
              </li>
              <li>
                <strong>Vercel Inc.</strong> — hosting frontend aplikacije (USA).
              </li>
            </UL>
          </li>
          <li>
            <strong>Nadležni organi</strong> u slučaju zakonske obaveze ili sudskog
            naloga.
          </li>
        </UL>
        <P>
          Tvoje podatke <strong>NE prodajemo</strong> trećim licima i NE koristimo
          ih za reklamno targetiranje.
        </P>
      </Section>

      <Section id="koliko" title="5. Koliko dugo čuvamo podatke">
        <UL>
          <li>
            <strong>Aktivni nalozi</strong> — dok god je nalog aktivan i 30 dana
            nakon poslednje aktivnosti.
          </li>
          <li>
            <strong>Obrisani nalozi</strong> — odmah uklanjamo lične podatke,
            izuzev onih koje moramo da čuvamo iz pravnih razloga (računi, poreske
            evidencije — do 10 godina).
          </li>
          <li>
            <strong>Logovi sigurnosti</strong> — do 90 dana.
          </li>
        </UL>
      </Section>

      <Section id="prava" title="6. Tvoja prava">
        <P>
          U skladu sa GDPR-om i lokalnim zakonima o zaštiti podataka, imaš
          sledeća prava:
        </P>
        <UL>
          <li>pravo na pristup svojim podacima i kopiju istih;</li>
          <li>pravo na ispravku netačnih ili nepotpunih podataka;</li>
          <li>pravo na brisanje („pravo na zaborav“);</li>
          <li>pravo na ograničenje obrade;</li>
          <li>pravo na prenosivost podataka u strukturiranom formatu;</li>
          <li>pravo na prigovor obradi po osnovu legitimnog interesa;</li>
          <li>
            pravo da povučeš svoju saglasnost u svako doba (ne utiče na
            zakonitost obrade pre povlačenja);
          </li>
          <li>
            pravo na žalbu nadzornom organu (npr. Poverenik za informacije od
            javnog značaja u Srbiji, AZOP u Hrvatskoj, AVPDPL u BiH).
          </li>
        </UL>
        <P>
          Detaljnije o ovim pravima i kako ih ostvaruješ, pročitaj na našoj{' '}
          <a href="/gdpr" className="text-primary hover:underline">
            GDPR stranici
          </a>
          .
        </P>
      </Section>

      <Section id="bezbednost" title="7. Bezbednost podataka">
        <P>Tvoji podaci su zaštićeni primenom industrijskih standarda:</P>
        <UL>
          <li>HTTPS (TLS 1.3) za sav saobraćaj između tebe i Platforme;</li>
          <li>
            lozinke se čuvaju isključivo kao bcrypt hash — niko, ni mi, ne može
            da pročita tvoju lozinku;
          </li>
          <li>
            row-level security (RLS) na nivou baze obezbeđuje da svaki korisnik
            vidi samo svoje podatke;
          </li>
          <li>
            redovni backupi i provera ranjivosti.
          </li>
        </UL>
        <P>
          U malo verovatnom slučaju proboja sigurnosti, obavestićemo te i nadležni
          organ u roku od 72 sata, kako nalaže GDPR.
        </P>
      </Section>

      <Section id="cookies" title="8. Kolačići (Cookies)">
        <P>Koristimo samo tzv. „neophodne“ kolačiće:</P>
        <UL>
          <li>
            <strong>sb-access-token, sb-refresh-token</strong> — Supabase
            autentifikacija sesije.
          </li>
        </UL>
        <P>
          Ne koristimo Google Analytics, Facebook Pixel ni druge tracking servise
          koji bi zahtevali tvoju saglasnost.
        </P>
      </Section>

      <Section id="deca" title="9. Deca">
        <P>
          Platforma nije namenjena licima mlađim od 18 godina. Ako saznamo da smo
          slučajno prikupili podatke o detetu mlađem od 18 godina, odmah ih
          brišemo.
        </P>
      </Section>

      <Section id="izmene" title="10. Izmene ove politike">
        <P>
          Ovu politiku možemo s vremena na vreme ažurirati. O značajnim izmenama
          ćemo te obavestiti email-om najmanje 14 dana pre nego što stupe na
          snagu.
        </P>
      </Section>

      <Section id="kontakt" title="11. Kontakt">
        <P>
          Za sva pitanja u vezi sa privatnošću ili da iskoristiš neko od svojih
          prava, piši nam na{' '}
          <a href="mailto:[CONTACT_EMAIL]" className="text-primary hover:underline">
            [CONTACT_EMAIL]
          </a>{' '}
          ili na našu poštansku adresu navedenu u sekciji 1.
        </P>
      </Section>
    </LegalPage>
  );
}
