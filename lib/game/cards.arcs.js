// Storylines. These scenes are never drawn at random: an earlier decision
// schedules them, and by the time they arrive the person involved already has
// a name, a history with you and a loyalty number you moved yourself.

import { hasPerson, loyaltyOf, personName } from './people';
import { U } from './engine';

const T = (sq, en) => ({ sq, en });
const O = (label, hint, fx, res, extra = {}) => ({ label, hint, fx, res, ...extra });

const strongestRival = (s) => s.rivals.filter((r) => r.alive).sort((a, b) => b.value - a.value)[0];

const ARCS = [
  /* ------------------------------------------------ the co-founder storyline */
  {
    id: 'arc_cof_tension', once: true, weight: 0,
    req: (s) => hasPerson(s, 'cofounder'),
    title: (s) => T(`${personName(s, 'cofounder')} nuk pajtohet`, `${personName(s, 'cofounder')} disagrees`),
    body: (s) => T(
      `${personName(s, 'cofounder')} dëshiron ta çojë kompaninë diku tjetër: më ngadalë, më thellë, me më pak rrezik. Diskutimi zgjati katër orë dhe mbaroi pa vendim.`,
      `${personName(s, 'cofounder')} wants to take the company somewhere else: slower, deeper, with less risk. The argument ran four hours and ended without a decision.`),
    opts: [
      O(T('Vendimi është i tyre', 'Let them call it'), T('Besim i fituar, drejtim i humbur.', 'Trust earned, direction lost.'),
        { loyalty: { cofounder: 22 }, revMult: 0.97, marginAdd: 0.04, morale: 10 },
        (s) => T(`${personName(s, 'cofounder')} merr timonin për një vit. Rritja ngadalësohet, themelet forcohen.`,
                 `${personName(s, 'cofounder')} takes the wheel for a year. Growth slows, the foundation hardens.`),
        { queue: [{ id: 'arc_cof_pact', in: 7 }, { id: 'arc_cof_exit', in: 7 }] }),
      O(T('Vendos ti, hapur', 'Overrule them, openly'), T('Drejtim i qartë, çarje e hapur.', 'Clear direction, open crack.'),
        { loyalty: { cofounder: -26 }, revMult: 1.1, morale: -8, stress: 8 },
        (s) => T(`E bën si thua ti para gjithë ekipit. ${personName(s, 'cofounder')} nuk kundërshton më — dhe kjo është më keq.`,
                 `You do it your way in front of the whole team. ${personName(s, 'cofounder')} stops objecting — which is worse.`),
        { queue: [{ id: 'arc_cof_exit', in: 6 }, { id: 'arc_cof_pact', in: 9 }] }),
      O(T('Ndani territorin', 'Split the territory'), T('Paqe e ndërtuar mbi kufij.', 'Peace built on borders.'),
        { loyalty: { cofounder: 8 }, marginAdd: 0.02, revMult: 1.03, stress: -6 },
        (s) => T(`Ti merr tregun, ${personName(s, 'cofounder')} merr produktin. Funksionon derisa të ketë një vendim që i prek të dyja.`,
                 `You take the market, ${personName(s, 'cofounder')} takes the product. It works until a decision touches both.`),
        { queue: [{ id: 'arc_cof_pact', in: 8 }] }),
    ],
  },
  {
    id: 'arc_cof_exit', once: true, weight: 0,
    req: (s) => hasPerson(s, 'cofounder') && loyaltyOf(s, 'cofounder') < 48,
    title: (s) => T(`${personName(s, 'cofounder')} do të dalë`, `${personName(s, 'cofounder')} wants out`),
    body: (s) => T(
      `${personName(s, 'cofounder')} të ul përballë dhe e thotë qetë: nuk e sheh më veten këtu. Aksionet e tyre janë ende në tavolinë, dhe po ashtu gjysma e ekipit që i besojnë.`,
      `${personName(s, 'cofounder')} sits you down and says it quietly: they no longer see themselves here. Their shares are still on the table, and so is half a team that trusts them.`),
    opts: [
      O(T('Blij aksionet e tyre', 'Buy their shares'), T('E shtrenjtë. E pastër.', 'Expensive. Clean.'),
        { cashU: -6, equity: 18, loyalty: { cofounder: 10 }, morale: -8, leave: ['cofounder'] },
        (s) => T('Paguan çmimin e plotë dhe ndaheni me dorë të shtrënguar. Pronësia kthehet e tëra te ti.',
                 'You pay full price and part with a handshake. The ownership comes back whole.')),
      O(T('Lëri të dalin me aksionet', 'Let them leave holding equity'), T('Kursen para, mban një pronar të largët.', 'Saves cash, keeps a distant owner.'),
        { morale: -12, rep: -4, leave: ['cofounder'] },
        (s) => T(`${personName(s, 'cofounder')} largohet, por mbetet në tabelën e pronësisë përgjithmonë. Do t'i shohësh përsëri në çdo negociatë.`,
                 `${personName(s, 'cofounder')} leaves but stays on the cap table forever. You will meet them again in every negotiation.`)),
      O(T('Bindi të qëndrojnë', 'Talk them into staying'), T('Përpjekje e sinqertë me fund të pasigurt.', 'An honest attempt with an uncertain end.'),
        { stress: 10 },
        (s) => T(`Flisni deri në mëngjes për gjithçka që ndërtuat bashkë.`,
                 `You talk until morning about everything you built together.`),
        { risk: { p: 0.5,
          bad: { fx: { leave: ['cofounder'], spawnRivalFrom: 'cofounder', team: -3, morale: -14, rep: -6 },
                 res: (s) => T('Ikin gjithsesi — dhe marrin tre nga njerëzit më të mirë për të hapur diçka të vetën.',
                               'They leave anyway — and take three of your best people to start something of their own.') },
          good: { fx: { loyalty: { cofounder: 30 }, morale: 16, revMult: 1.06 },
                  res: (s) => T('Qëndrojnë. Marrëdhënia nuk kthehet si më parë, por bëhet më e ndershme.',
                                'They stay. The relationship does not go back to what it was, it becomes more honest.') } } }),
    ],
  },
  {
    id: 'arc_cof_pact', once: true, weight: 0,
    req: (s) => hasPerson(s, 'cofounder') && loyaltyOf(s, 'cofounder') >= 62,
    title: (s) => T(`Basti i ${personName(s, 'cofounder')}`, `${personName(s, 'cofounder')}'s bet`),
    body: (s) => T(
      `${personName(s, 'cofounder')} vjen me një plan që do ta dyfishonte kompaninë ose do të hante dy vitet e ardhshme. Ata e kanë menduar gjatë dhe të kërkojnë vetëm një gjë: besim.`,
      `${personName(s, 'cofounder')} brings a plan that would either double the company or eat the next two years. They have thought it through and ask for one thing: trust.`),
    opts: [
      O(T('Ecim bashkë', 'We go together'), T('Besim i plotë, ekspozim i plotë.', 'Full trust, full exposure.'),
        { cashU: -3, loyalty: { cofounder: 15 }, morale: 12, stress: 8 },
        T('Nënshkruani të dy dhe nuk ka rrugë kthimi.', 'You both sign and there is no way back.'),
        { risk: { p: 0.38,
          bad: { fx: { revMult: 0.9, cashU: -1.5, morale: -10 },
                 res: T('Plani nuk mbahet. Humbni dy vite — por asnjëri nuk ia hedh fajin tjetrit.',
                        'The plan does not hold. You lose two years — and neither of you blames the other.') },
          good: { fx: { revMult: 1.45, valuation: 1.2, rep: 12, influence: 8 },
                  res: T('Funksionon. Kompania kalon në një kategori tjetër dhe ju të dy e dini pse.',
                         'It works. The company moves into another category and you both know why.') } } }),
      O(T('Provoje në të vogël', 'Test it small'), T('Kujdes i arsyeshëm.', 'Reasonable caution.'),
        { cashU: -0.8, revMult: 1.08, loyalty: { cofounder: -6 }, marginAdd: 0.02 },
        (s) => T(`${personName(s, 'cofounder')} pranon me mirësjellje. Diçka nga entuziazmi i tyre nuk kthehet.`,
                 `${personName(s, 'cofounder')} accepts politely. Some of their enthusiasm does not come back.`)),
      O(T('Jo. Fokus.', 'No. Focus.'), T('Disiplinë me kosto njerëzore.', 'Discipline with a human cost.'),
        { marginAdd: 0.05, loyalty: { cofounder: -22 }, morale: -8 },
        T('E mbyll bisedën në dhjetë minuta. Numrat të japin të drejtë këtë vit.',
          'You close the conversation in ten minutes. The numbers agree with you this year.'),
        { queue: [{ id: 'arc_cof_exit', in: 6 }] }),
    ],
  },

  /* ------------------------------------------------- the right hand storyline */
  {
    id: 'arc_hand_rise', stage: [1, 9], weight: 6, once: true,
    req: (s) => s.teamSize >= 5 && !hasPerson(s, 'hand'),
    title: T('Dikush dallon', 'Someone stands out'),
    body: T('Një nga punonjësit e tu zgjidh probleme që nuk ia ke dhënë kurrë. Ekipi tashmë e pyet atë para se të pyesë ty.',
            'One of your people solves problems you never assigned. The team already asks them before asking you.'),
    opts: [
      O(T('Ngrite mbi të gjithë', 'Put them above everyone'), T('Fuqi e vërtetë, xhelozi e vërtetë.', 'Real power, real jealousy.'),
        { join: { hand: { loyalty: 78 } }, revMult: 1.12, stress: -12, morale: -5 },
        (s) => T(`${personName(s, 'hand')} merr gjysmën e kompanisë mbi supe. Ti fle për herë të parë prej muajsh.`,
                 `${personName(s, 'hand')} takes half the company on their shoulders. You sleep for the first time in months.`),
        { queue: [{ id: 'arc_hand_offer', in: 8 }] }),
      O(T('Mbaje pranë, pa titull', 'Keep them close, no title'), T('Kosto zero, rrezik i heshtur.', 'Zero cost, quiet risk.'),
        { join: { hand: { loyalty: 52 } }, revMult: 1.05, stress: -4 },
        (s) => T(`${personName(s, 'hand')} bën punën e një drejtuesi me pagën e dikujt tjetër. E vë re.`,
                 `${personName(s, 'hand')} does an executive's job on someone else's salary. They notice.`),
        { queue: [{ id: 'arc_hand_offer', in: 6 }] }),
      O(T('Mos e trazo hierarkinë', 'Do not disturb the hierarchy'), T('Qetësi tani, humbje më vonë.', 'Calm now, loss later.'),
        { morale: -6, revMult: 0.99 },
        T('Gjithçka mbetet siç ishte. Njerëzit e mirë e kuptojnë shpejt kur nuk ka rrugë përpara.',
          'Everything stays as it was. Good people quickly work out when there is no way up.')),
    ],
  },
  {
    id: 'arc_hand_offer', once: true, weight: 0,
    req: (s) => hasPerson(s, 'hand'),
    title: (s) => T(`${personName(s, 'hand')} ka një ofertë`, `${personName(s, 'hand')} has an offer`),
    body: (s) => T(
      `${personName(s, 'hand')} ta thotë vetë, para se ta marrësh vesh nga të tjerët: dikush u ofron të drejtojnë kompaninë e vet. Të pyesin çfarë mendon ti.`,
      `${personName(s, 'hand')} tells you before you hear it elsewhere: someone has offered them a company of their own to run. They are asking what you think.`),
    opts: [
      O(T('Jepu një divizion dhe pronësi', 'Give them a division and equity'), T('Paguan shtrenjtë për të mbajtur më të mirin.', 'You pay dearly to keep the best.'),
        { equity: -7, loyalty: { hand: 25 }, revU: 1.4, morale: 12, valuation: 1.06 },
        (s) => T(`${personName(s, 'hand')} qëndron si pronar, jo si punonjës. Divizioni i tyre bëhet pjesa më e shëndetshme e biznesit.`,
                 `${personName(s, 'hand')} stays as an owner, not an employee. Their division becomes the healthiest part of the business.`)),
      O(T('Barazo pagën dhe mbylle temën', 'Match the salary and move on'), T('Zgjidhje e shpejtë, e cekët.', 'Fast fix, shallow.'),
        { costMult: 1.08, loyalty: { hand: -8 }, morale: 4 },
        T('Pranon paratë. Pyetja që bëri nuk ishte për paratë.',
          'They take the money. The question they asked was not about money.'),
        { queue: [{ id: 'arc_hand_leave', in: 6 }] }),
      O(T('Uroju fat', 'Wish them luck'), T('Dorëzim i sjellshëm.', 'A gracious surrender.'),
        { leave: ['hand'], team: -1, revMult: 0.95, rep: 6, morale: -6 },
        (s) => T('I hap derën vetë dhe e përcjell. Ekipi e sheh se si ndahesh me njerëzit — dhe kjo kujtohet.',
                 'You open the door yourself and walk them out. The team sees how you part with people — and that is remembered.')),
    ],
  },
  {
    id: 'arc_hand_leave', once: true, weight: 0,
    req: (s) => hasPerson(s, 'hand') && loyaltyOf(s, 'hand') < 55,
    title: (s) => T(`${personName(s, 'hand')} jep dorëheqjen`, `${personName(s, 'hand')} resigns`),
    body: (s) => T(
      `Letra është dy rreshta. ${personName(s, 'hand')} po hap diçka të veten — në tregun tënd, me njerëz që i njeh me emër.`,
      `The letter is two lines long. ${personName(s, 'hand')} is starting something of their own — in your market, with people you know by name.`),
    opts: [
      O(T('Investo në kompaninë e tyre', 'Invest in their company'), T('Kthen rivalin në partner.', 'Turns a rival into a partner.'),
        { cashU: -3, influence: 10, rep: 8, leave: ['hand'], revMult: 0.97 },
        T('Nëse do të ndërtohet gjithsesi, më mirë ta ndërtojnë me paratë e tua.',
          'If it is going to be built anyway, better it is built with your money.')),
      O(T('Mbroje territorin', 'Defend the territory'), T('Kontrata, klauzola, avokatë.', 'Contracts, clauses, lawyers.'),
        { cashU: -1.2, rep: -8, morale: -10, leave: ['hand'], spawnRivalFrom: 'hand' },
        (s) => T('I dërgon letër zyrtare ditën e dytë. Ata hapin gjithsesi — tani si armik.',
                 'You send a formal letter on day two. They launch anyway — now as an enemy.')),
      O(T('Lëri të shkojnë, pa zhurmë', 'Let them go quietly'), T('Pa kosto sot, konkurrent nesër.', 'No cost today, a competitor tomorrow.'),
        { leave: ['hand'], spawnRivalFrom: 'hand', team: -2, revMult: 0.94, rep: 4 },
        T('Ndaheni mirë. Brenda dy vitesh, emri i tyre është në listën e rivalëve të tu.',
          'You part well. Within two years their name is on your rival list.')),
    ],
  },

  /* ------------------------------------------------------ the personal rival */
  {
    id: 'arc_duel_open', stage: [2, 11], weight: 5, once: true,
    req: (s) => { const r = strongestRival(s); return !!r && r.value > 300000 && s.revenue > 250000; },
    title: (s) => T(`${strongestRival(s).ceo} flet për ty`, `${strongestRival(s).ceo} talks about you`),
    body: (s) => {
      const r = strongestRival(s);
      return T(
        `Në një panel me gazetarë, ${r.ceo} nga ${r.name} u pyet për ty dhe buzëqeshi: "Ata janë të vegjël. Ne i njohim të gjithë të vegjlit." Salla qeshi.`,
        `On a panel with journalists, ${r.ceo} of ${r.name} was asked about you and smiled: "They are small. We know all the small ones." The room laughed.`);
    },
    opts: [
      O(T('Përgjigju publikisht', 'Answer in public'), T('Vëmendje e madhe, ekspozim i madh.', 'Big attention, big exposure.'),
        { rep: 6, influence: 10, stress: 8, set: { duel: true } },
        T('Përgjigjja jote qarkullon më shumë se deklarata e tyre. Tani të gjithë presin rezultatin.',
          'Your answer travels further than their statement. Now everyone waits for the scoreboard.'),
        { queue: [{ id: 'arc_duel_close', in: 9 }] }),
      O(T('Përgjigju me numra, në heshtje', 'Answer with numbers, silently'), T('Pa zhurmë, me rezultat.', 'No noise, just results.'),
        { revMult: 1.1, marginAdd: 0.03, stress: 6, set: { duel: true } },
        T('Nuk thua asgjë. Vitin tjetër, të dhënat e tregut e thonë për ty.',
          'You say nothing. Next year, the market data says it for you.'),
        { queue: [{ id: 'arc_duel_close', in: 9 }] }),
      O(T('Kërko një takim privat', 'Ask for a private meeting'), T('Armiqësi e kthyer në marrëveshje.', 'Hostility turned into an arrangement.'),
        { influence: 8, marginAdd: 0.02, rep: -2, set: { duel: true, truce: true } },
        (s) => T(`Hani darkë pa dëshmitarë. Dilni me një kufi tregu që askush nuk do ta pranojë publikisht.`,
                 `You have dinner without witnesses. You leave with a market boundary neither of you will admit in public.`),
        { queue: [{ id: 'arc_duel_close', in: 9 }] }),
    ],
  },
  {
    id: 'arc_duel_close', once: true, weight: 0,
    req: (s) => s.flags.duel && !!strongestRival(s),
    title: (s) => T(`Llogaria me ${strongestRival(s).ceo}`, `The reckoning with ${strongestRival(s).ceo}`),
    body: (s) => {
      const r = strongestRival(s);
      const ahead = (s.revenue * s.multiple) > r.value;
      return T(
        ahead
          ? `${r.ceo} kërkon takim. Këtë herë nuk buzëqeshin: ${r.name} po humbet terren dhe e dinë se kush ua mori.`
          : `${r.name} është ende përpara teje dhe ${r.ceo} e di. Oferta që të bëjnë është njëkohësisht dorë e zgjatur dhe kërcënim.`,
        ahead
          ? `${r.ceo} asks for a meeting. They are not smiling this time: ${r.name} is losing ground and they know who took it.`
          : `${r.name} is still ahead of you and ${r.ceo} knows it. What they offer is both a hand and a threat.`);
    },
    opts: [
      O(T('Blij kompaninë e tyre', 'Buy their company'), T('Fund i luftës, fatura e plotë.', 'End of the war, full invoice.'),
        { cashU: -8, revU: 2.6, team: 6, influence: 14, rep: 10, morale: -4 },
        (s) => T('Nënshkruani në zyrën tënde. Emri i tyre hiqet nga fasada brenda tre muajsh.',
                 'You sign in your office. Their name comes off the building within three months.'),
        { req: (s) => s.cash > U(s) * 6 }),
      O(T('Bashkoni forcat', 'Join forces'), T('Më pak pronësi, shumë më pak armiq.', 'Less ownership, far fewer enemies.'),
        { equity: -18, revU: 3, influence: 16, valuation: 1.15, stress: -10 },
        T('Dy kompani bëhen një. Askush nuk e quan blerje, të gjithë e dinë se kush fitoi.',
          'Two companies become one. Nobody calls it an acquisition, everyone knows who won.')),
      O(T('Lufto deri në fund', 'Fight it to the end'), T('Krenari dhe rrezik i pastër.', 'Pride and pure risk.'),
        { stress: 14, cashU: -1.5 },
        T('Refuzon çdo marrëveshje dhe e çon në terren.', 'You refuse every deal and take it to the field.'),
        { risk: { p: 0.45,
          bad: { fx: { revMult: 0.86, rep: -10, morale: -10, marginAdd: -0.04 },
                 res: (s) => T('Ata kishin xhepa më të thellë. Humbet treg dhe dy vite.',
                               'They had deeper pockets. You lose market and two years.') },
          good: { fx: { revMult: 1.3, rep: 16, influence: 14, valuation: 1.12 },
                  res: (s) => T('Ata tërhiqen. Në industri, historia tregohet me emrin tënd në fund.',
                                'They pull back. In the industry, the story now ends with your name.') } } }),
    ],
  },

  /* --------------------------------------------------------- the family debt */
  {
    id: 'arc_family_debt', once: true, weight: 0,
    req: (s) => s.flags.familyDebt && !s.flags.familyPaid,
    title: T('Zarfi kthehet', 'The envelope comes back'),
    body: T('Xhaxhai nuk kërkon asgjë. E ëma jote e përmend një herë, butë, në telefon. Ti e di saktësisht sa është shuma dhe sa vite kanë kaluar.',
            "Your uncle asks for nothing. Your mother mentions it once, gently, on the phone. You know exactly what the number is and how many years have passed."),
    opts: [
      O(T('Shlyej gjithçka, dyfish', 'Repay it all, doubled'), T('Kosto reale, borxh njerëzor i mbyllur.', 'Real cost, a human debt closed.'),
        { cashU: -2.5, debtClear: 1, rep: 10, morale: 12, stress: -14, set: { familyPaid: true } },
        T('E lë zarfin në tavolinë pa thënë asgjë. Është nata e parë prej vitesh që ha darkë i qetë.',
          'You leave the envelope on the table without a word. It is the first dinner in years you eat in peace.')),
      O(T('Shlyej dhe jepu pjesë', 'Repay and give them a share'), T('Familja bëhet pronare.', 'The family becomes an owner.'),
        { cashU: -1.5, equity: -5, debtClear: 1, rep: 8, morale: 10, influence: 4, set: { familyPaid: true } },
        T('Tani ata kanë emrin në kompani. Krenaria e tyre vlen më shumë se 5% që dhe.',
          'Now their name is on the company. Their pride is worth more than the 5% you gave.')),
      O(T('Më vonë, kur të jetë koha', 'Later, when the time is right'), T('Kursen para. Mban një peshë.', 'Saves money. Keeps a weight.'),
        { cashU: 0.5, stress: 10, morale: -6, rep: -4 },
        T('E shtyn edhe një vit. Është më e lehtë çdo herë — dhe kjo është pjesa që të shqetëson.',
          'You defer it another year. It gets easier every time — and that is the part that worries you.')),
    ],
  },
  /* ------------------------------------------------------------- the mentor */
  {
    id: 'arc_mentor_call', once: true, weight: 0,
    req: (s) => hasPerson(s, 'mentor'),
    title: (s) => T(`${personName(s, 'mentor')} kërkon diçka`, `${personName(s, 'mentor')} asks for something`),
    body: (s) => T(
      `Për herë të parë, ${personName(s, 'mentor')} nuk telefonon për të dhënë këshillë. Një kompani ku kanë vënë emrin e tyre po fundoset, dhe koha ka mbaruar.`,
      `For the first time, ${personName(s, 'mentor')} is not calling to give advice. A company they put their name on is sinking, and the time is gone.`),
    opts: [
      O(T('Hyr me para dhe me emër', 'Step in with money and name'), T('Kosto e menjëhershme, borxh moral i kthyer.', 'Immediate cost, a moral debt repaid.'),
        { cashU: -3, loyalty: { mentor: 20 }, influence: 16, rep: 10, stress: 6 },
        (s) => T(`E shpëton. ${personName(s, 'mentor')} nuk e përmend më kurrë — por dera e tyre nuk mbyllet më kurrë për ty.`,
                 `You save it. ${personName(s, 'mentor')} never mentions it again — but their door never closes to you again.`)),
      O(T('Ndihmo pa para: kohë dhe njerëz', 'Help without money: time and people'), T('Pa faturë, me vëmendje të ndarë.', 'No invoice, divided attention.'),
        { revMult: 0.97, loyalty: { mentor: 10 }, influence: 8, rep: 6, stress: 10 },
        T('U jep dy nga njerëzit e tu për gjashtë muaj. Kompania jote ndihet, por qëndron.',
          'You lend them two of your people for six months. Your own company feels it, but holds.')),
      O(T('Jo. Nuk është biznesi im.', 'No. Not my business.'), T('Disiplinë financiare, çmim njerëzor.', 'Financial discipline, human price.'),
        { cashU: 0.5, loyalty: { mentor: -35 }, influence: -8, morale: -4 },
        (s) => T(`${personName(s, 'mentor')} e pranon me një "e kuptoj" të shkurtër. Telefonatat e tyre rrallohen që nga ajo javë.`,
                 `${personName(s, 'mentor')} takes it with a short "I understand". Their calls thin out from that week on.`)),
    ],
  },
];

export default ARCS;
