import type { Metadata } from 'next';
import LegalPage, { Section, P, UL, H3 } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Uslovi korišćenja | UGC Executive',
  description: 'Uslovi korišćenja UGC Executive platforme.',
};

export default function UsloviKoriscenjaPage() {
  return (
    <LegalPage
      title="Uslovi korišćenja"
      lastUpdated="5. maj 2026."
      intro={
        'Pažljivo pročitaj ove uslove pre korišćenja platforme. Korišćenjem ' +
        'UGC Executive prihvataš sve odredbe navedene u ovom dokumentu. Ako se ne ' +
        'slažeš sa nekim delom uslova, molimo te da ne koristiš platformu.'
      }
    >
      <Section id="o-nama" title="1. O nama">
        <P>
          UGC Executive (u daljem tekstu „Platforma“, „mi“, „nas“) je usluga koju
          pruža <strong>Minnie Downtown Media LLC</strong>, registrovana u državi Wyoming,
          Sjedinjene Američke Države, sa sedištem na adresi <strong>30 N Gould St Ste R, Sheridan, WY 82801, USA</strong>.
        </P>
        <P>
          Platforma je dostupna na adresi{' '}
          <a href="https://app.ugcexecutive.com" className="text-primary hover:underline">
            app.ugcexecutive.com
          </a>{' '}
          i povezuje brendove (u daljem tekstu „Biznis korisnici“) sa kreatorima
          autentičnog korisnički-generisanog sadržaja (u daljem tekstu „Kreatori“).
        </P>
      </Section>

      <Section id="prihvatanje" title="2. Prihvatanje uslova">
        <P>
          Registracijom naloga, klikom na „Prihvatam“ tokom checkout-a, ili samim
          korišćenjem Platforme, potvrđuješ da si pročitao, razumeo i prihvatio ove
          Uslove korišćenja, kao i našu{' '}
          <a href="/politika-privatnosti" className="text-primary hover:underline">
            Politiku privatnosti
          </a>{' '}
          i{' '}
          <a href="/gdpr" className="text-primary hover:underline">
            GDPR informacije
          </a>
          .
        </P>
        <P>
          Moraš imati najmanje 18 godina ili biti punoletan u svojoj jurisdikciji da
          bi koristio Platformu. Ako registruješ nalog u ime pravnog lica, izjavljuješ
          da imaš ovlašćenje da to lice obavežeš ovim uslovima.
        </P>
      </Section>

      <Section id="nalog" title="3. Korisnički nalog">
        <H3>3.1 Tipovi naloga</H3>
        <P>Platforma ima dva tipa korisničkih naloga:</P>
        <UL>
          <li>
            <strong>Biznis nalog</strong> — namenjen brendovima i agencijama koje žele
            da pretražuju i kontaktiraju Kreatore. Pristup zahteva aktivnu pretplatu.
          </li>
          <li>
            <strong>Kreator nalog</strong> — namenjen pojedincima koji se bave
            kreiranjem sadržaja. Registracija i pojavljivanje u pretrazi su besplatni.
          </li>
        </UL>

        <H3>3.2 Tačnost podataka</H3>
        <P>
          Obavezuješ se da ćeš pružiti tačne, ažurne i potpune podatke prilikom
          registracije i da ćeš ih održavati ažurnim. Imitiranje druge osobe ili
          firme, kao i kreiranje lažnog naloga, predstavlja kršenje uslova i razlog
          za momentalno suspendovanje naloga.
        </P>

        <H3>3.3 Bezbednost</H3>
        <P>
          Odgovoran si za čuvanje pristupnih podataka (email i lozinke) i za sve
          aktivnosti koje se odvijaju pod tvojim nalogom. Ako sumnjaš na neovlašćen
          pristup, dužan si da nas odmah obavestiš na{' '}
          <a href="mailto:hello@ugcexecutive.com" className="text-primary hover:underline">
            hello@ugcexecutive.com
          </a>
          .
        </P>
      </Section>

      <Section id="pretplata" title="4. Pretplata, naplata i otkazivanje">
        <H3>4.1 Naplata</H3>
        <P>
          Pristup Biznis funkcionalnostima Platforme se naplaćuje putem mesečne ili
          godišnje pretplate. Cene su navedene u USD valuti na našoj{' '}
          <a href="/pricing" className="text-primary hover:underline">
            stranici sa cenama
          </a>{' '}
          i mogu se promeniti uz obaveštenje 30 dana unapred.
        </P>
        <P>
          Naplata se obavlja preko procesora plaćanja Stripe. Mi ne čuvamo niti
          imamo pristup podacima o tvojoj kartici.
        </P>

        <H3>4.2 Automatsko obnavljanje</H3>
        <P>
          Pretplata se automatski obnavlja na kraju svakog perioda (mesečno ili
          godišnje), osim ako je ne otkažeš pre datuma obnove. Otkazivanje možeš
          izvršiti u svako doba kroz panel <em>Podešavanja → Pretplata</em>.
        </P>

        <H3>4.3 Refundacija</H3>
        <P>
          Pretplate su <strong>neopozive</strong> osim ako zakon ne nalaže drugačije.
          Ako otkažeš pretplatu pre kraja platnog perioda, zadržavaš pristup do
          kraja tog perioda, ali se već uplaćeni iznos ne refundira pro rata.
        </P>
        <P>
          Izuzetak je tzv. <em>cooling-off period</em> od 14 dana koji važi za
          potrošače u EU pri prvoj pretplati — u tom roku možeš zatražiti pun
          povraćaj novca slanjem zahteva na{' '}
          <a href="mailto:hello@ugcexecutive.com" className="text-primary hover:underline">
            hello@ugcexecutive.com
          </a>
          , osim ako si već koristio značajne funkcionalnosti Platforme.
        </P>
      </Section>

      <Section id="dozvoljeno" title="5. Dozvoljeno korišćenje">
        <P>Korišćenjem Platforme se obavezuješ da NEĆEŠ:</P>
        <UL>
          <li>kršiti bilo koji važeći zakon ili regulativu;</li>
          <li>
            zloupotrebljavati kontakt podatke Kreatora (slati spam, prevarne ponude,
            ili zloupotrebljavati ih za bilo koju svrhu mimo direktne saradnje);
          </li>
          <li>kopirati, scrape-ovati ili masovno preuzimati sadržaj Platforme;</li>
          <li>
            pokušavati da zaobiđeš sigurnosne mehanizme, autentifikaciju ili rate
            limit;
          </li>
          <li>
            postavljati materijale koji su nezakoniti, uvredljivi, klevetnički,
            opsceni ili krše prava intelektualne svojine trećih lica;
          </li>
          <li>koristiti Platformu za pranje novca ili druge ilegalne aktivnosti.</li>
        </UL>
        <P>
          Kršenje ovih pravila može dovesti do trenutnog suspendovanja naloga bez
          povraćaja novca.
        </P>
      </Section>

      <Section id="sadrzaj" title="6. Sadržaj korisnika">
        <H3>6.1 Tvoj sadržaj</H3>
        <P>
          Zadržavaš sva prava na sadržaj koji postavljaš na Platformu (profil,
          portfolio, opis, slike). Postavljanjem sadržaja, daješ nam ne-isključivu,
          besplatnu, prenosivu licencu da taj sadržaj prikazujemo unutar Platforme
          u svrhe za koje je namenjen.
        </P>

        <H3>6.2 Saradnja Biznis ↔ Kreator</H3>
        <P>
          Platforma služi isključivo kao <strong>posrednik</strong> za prvi
          kontakt. Sve dalje pregovore, ugovore, plaćanja i isporuku sadržaja
          dogovaraju strane direktno između sebe. UGC Executive nije strana u tim
          ugovorima i ne snosi odgovornost za bilo kakav spor između Biznisa i
          Kreatora.
        </P>
      </Section>

      <Section id="ip" title="7. Intelektualna svojina">
        <P>
          Sav sadržaj Platforme (osim sadržaja korisnika) — uključujući dizajn,
          logo, kod, tekstove, baze podataka — je vlasništvo{' '}
          <strong>Minnie Downtown Media LLC</strong> i zaštićen je zakonima o
          intelektualnoj svojini. Bez naše izričite pisane saglasnosti zabranjeno
          je kopiranje, modifikovanje ili komercijalno korišćenje.
        </P>
      </Section>

      <Section id="garancija" title="8. Odricanje od odgovornosti">
        <P>
          Platforma se pruža „takva kakva jeste“ (<em>as is</em>) bez ikakvih
          izričitih ili implicitnih garancija. Ne garantujemo da:
        </P>
        <UL>
          <li>će Platforma biti dostupna 100% vremena bez prekida;</li>
          <li>će svi prikazani Kreatori odgovoriti na poslate kontakte;</li>
          <li>
            će saradnja sa Kreatorima dovesti do određenog poslovnog rezultata;
          </li>
          <li>
            su podaci o Kreatorima (cene, dostupnost, statistike) uvek 100% tačni
            i ažurni — Kreatori sami održavaju te podatke.
          </li>
        </UL>
        <P>
          Naša ukupna odgovornost prema tebi, bez obzira na osnov, neće preći
          iznos koji si platio za pretplatu u poslednjih 12 meseci.
        </P>
      </Section>

      <Section id="prekid" title="9. Prekid naloga">
        <P>
          Možeš u bilo kom trenutku obrisati svoj nalog kroz panel{' '}
          <em>Podešavanja</em>. Mi zadržavamo pravo da suspendujemo ili obrišemo
          tvoj nalog ako kršiš ove uslove, ako sumnjamo na prevaru, ili ako
          dobijemo nalog od nadležnih organa.
        </P>
      </Section>

      <Section id="izmene" title="10. Izmene uslova">
        <P>
          Možemo s vremena na vreme menjati ove uslove. O značajnim izmenama
          obavestićemo te email-om i preko notifikacije u Platformi najmanje 14
          dana pre nego što izmene stupe na snagu. Nastavkom korišćenja Platforme
          posle tog roka prihvataš nove uslove.
        </P>
      </Section>

      <Section id="zakon" title="11. Merodavno pravo i nadležnost">
        <P>
          Ovi uslovi se tumače u skladu sa zakonima države <strong>Wyoming, USA</strong>,
          bez obzira na principe sukoba zakona. Sve sporove ćemo prvenstveno
          pokušati da rešimo mirnim putem. U slučaju spora koji se ne može rešiti
          mirno, isključivo nadležan je sud u <strong>Sheridanu, Wyoming, USA</strong>.
        </P>
        <P>
          Ako si potrošač iz Evropske Unije, ova odredba ne ograničava tvoja
          obavezna prava prema lokalnom zakonu o zaštiti potrošača.
        </P>
      </Section>

      <Section id="kontakt" title="12. Kontakt">
        <P>
          Za sva pitanja u vezi sa ovim uslovima, piši nam na{' '}
          <a href="mailto:hello@ugcexecutive.com" className="text-primary hover:underline">
            hello@ugcexecutive.com
          </a>
          .
        </P>
      </Section>
    </LegalPage>
  );
}
