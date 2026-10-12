export type Grade = "9" | "10" | "11" | "12"
export type Subject = "chemistry" | "biology" | "physics"
export type LabId = "atom" | "molecule" | "dna" | "optics"
export type Topic = { en: string; zh: string; lab?: LabId }
const topic = (en: string, zh: string, lab?: LabId): Topic => ({ en, zh, lab })

/** Curated conceptual map for the school preview, NOT an NCERT textbook/chapter transcription. */
export const curriculum: Record<Grade, Record<Subject, Topic[]>> = {
 "9": {
   chemistry:[topic("Matter in our surroundings","物質與周遭環境"),topic("Mixtures and pure substances","混合物與純物質"),topic("Atoms and molecules","原子與分子","molecule"),topic("Inside an atom","原子的內部結構","atom"),topic("Valency and chemical formulae","化合價與化學式","molecule"),topic("Explore the periodic table","探索元素週期表","atom")],
   biology:[topic("Cells: the unit of life","細胞：生命的基本單位"),topic("Plant and animal tissues","植物與動物組織"),topic("Living organisms and diversity","生物與多樣性"),topic("Health and disease","健康與疾病"),topic("From cells to genetic material","從細胞到遺傳物質","dna")],
   physics:[topic("Motion and graphs","運動與圖表"),topic("Forces and Newton's laws","力與牛頓運動定律"),topic("Gravitation","萬有引力"),topic("Work, energy and power","功、能與功率"),topic("Sound and vibrations","聲音與振動"),topic("Explore light rays","探索光線","optics")]
 },
 "10": {
   chemistry:[topic("Chemical reactions and equations","化學反應與反應式"),topic("Acids, bases and salts","酸、鹼與鹽"),topic("Metals and non-metals","金屬與非金屬"),topic("Carbon and its compounds","碳及其化合物","molecule"),topic("Periodic trends and valency","週期趨勢與化合價","atom")],
   biology:[topic("Life processes","生命過程"),topic("Control and coordination","控制與協調"),topic("Reproduction","生殖"),topic("Heredity and inheritance","遺傳與性狀"),topic("DNA base pairing","DNA 鹼基配對","dna"),topic("Our environment","我們的環境")],
   physics:[topic("Reflection and refraction","反射與折射","optics"),topic("Human eye and colour","人眼與色彩"),topic("Electricity","電學"),topic("Magnetic effects of current","電流的磁效應")]
 },
 "11": {
   chemistry:[topic("Mole concept and stoichiometry","莫耳概念與化學計量"),topic("Structure of atom","原子結構","atom"),topic("Periodic properties","元素週期性質","atom"),topic("Chemical bonding and molecular structure","化學鍵與分子結構","molecule"),topic("Thermodynamics","熱力學"),topic("Chemical equilibrium","化學平衡"),topic("Organic chemistry foundations","有機化學基礎")],
   biology:[topic("Diversity of living organisms","生物多樣性"),topic("Plant and animal anatomy","動植物解剖學"),topic("Cell structure and function","細胞結構與功能"),topic("Biomolecules","生物分子"),topic("Cell division","細胞分裂"),topic("Plant physiology","植物生理學"),topic("Human physiology","人體生理學"),topic("DNA molecular structure","DNA 分子結構","dna")],
   physics:[topic("Units and measurements","單位與測量"),topic("Motion in one and two dimensions","一維與二維運動"),topic("Laws of motion","運動定律"),topic("Work and energy","功與能"),topic("Rotational motion","轉動運動"),topic("Gravitation","萬有引力"),topic("Thermal physics","熱物理"),topic("Oscillations and waves","振動與波動")]
 },
 "12": {
   chemistry:[topic("Solutions","溶液"),topic("Electrochemistry","電化學"),topic("Chemical kinetics","化學動力學"),topic("Transition elements","過渡元素"),topic("Coordination compounds","配位化合物","molecule"),topic("Organic functional groups","有機官能基","molecule"),topic("Biomolecules","生物分子","dna")],
   biology:[topic("Reproduction in organisms","生物生殖"),topic("Principles of inheritance","遺傳原理"),topic("Molecular basis of inheritance","遺傳的分子基礎","dna"),topic("Evolution","演化"),topic("Human health and disease","人體健康與疾病"),topic("Biotechnology","生物技術"),topic("Ecology and ecosystems","生態學與生態系")],
   physics:[topic("Electric charges and fields","電荷與電場"),topic("Electrostatic potential","靜電位"),topic("Current electricity","電流"),topic("Magnetism","磁學"),topic("Electromagnetic induction","電磁感應"),topic("Alternating current","交流電"),topic("Electromagnetic waves","電磁波"),topic("Ray and wave optics","幾何光學與波動光學","optics"),topic("Atoms and nuclei","原子與原子核"),topic("Semiconductors","半導體")]
 }
}

// Atomic numbers ordered 1–118. Source-neutral standard element names/symbols.
const atoms: [string,string][] = [
 ["H","Hydrogen"],["He","Helium"],["Li","Lithium"],["Be","Beryllium"],["B","Boron"],["C","Carbon"],["N","Nitrogen"],["O","Oxygen"],["F","Fluorine"],["Ne","Neon"],
 ["Na","Sodium"],["Mg","Magnesium"],["Al","Aluminium"],["Si","Silicon"],["P","Phosphorus"],["S","Sulfur"],["Cl","Chlorine"],["Ar","Argon"],["K","Potassium"],["Ca","Calcium"],
 ["Sc","Scandium"],["Ti","Titanium"],["V","Vanadium"],["Cr","Chromium"],["Mn","Manganese"],["Fe","Iron"],["Co","Cobalt"],["Ni","Nickel"],["Cu","Copper"],["Zn","Zinc"],
 ["Ga","Gallium"],["Ge","Germanium"],["As","Arsenic"],["Se","Selenium"],["Br","Bromine"],["Kr","Krypton"],["Rb","Rubidium"],["Sr","Strontium"],["Y","Yttrium"],["Zr","Zirconium"],
 ["Nb","Niobium"],["Mo","Molybdenum"],["Tc","Technetium"],["Ru","Ruthenium"],["Rh","Rhodium"],["Pd","Palladium"],["Ag","Silver"],["Cd","Cadmium"],["In","Indium"],["Sn","Tin"],
 ["Sb","Antimony"],["Te","Tellurium"],["I","Iodine"],["Xe","Xenon"],["Cs","Caesium"],["Ba","Barium"],["La","Lanthanum"],["Ce","Cerium"],["Pr","Praseodymium"],["Nd","Neodymium"],
 ["Pm","Promethium"],["Sm","Samarium"],["Eu","Europium"],["Gd","Gadolinium"],["Tb","Terbium"],["Dy","Dysprosium"],["Ho","Holmium"],["Er","Erbium"],["Tm","Thulium"],["Yb","Ytterbium"],["Lu","Lutetium"],
 ["Hf","Hafnium"],["Ta","Tantalum"],["W","Tungsten"],["Re","Rhenium"],["Os","Osmium"],["Ir","Iridium"],["Pt","Platinum"],["Au","Gold"],["Hg","Mercury"],["Tl","Thallium"],["Pb","Lead"],
 ["Bi","Bismuth"],["Po","Polonium"],["At","Astatine"],["Rn","Radon"],["Fr","Francium"],["Ra","Radium"],["Ac","Actinium"],["Th","Thorium"],["Pa","Protactinium"],["U","Uranium"],
 ["Np","Neptunium"],["Pu","Plutonium"],["Am","Americium"],["Cm","Curium"],["Bk","Berkelium"],["Cf","Californium"],["Es","Einsteinium"],["Fm","Fermium"],["Md","Mendelevium"],["No","Nobelium"],["Lr","Lawrencium"],
 ["Rf","Rutherfordium"],["Db","Dubnium"],["Sg","Seaborgium"],["Bh","Bohrium"],["Hs","Hassium"],["Mt","Meitnerium"],["Ds","Darmstadtium"],["Rg","Roentgenium"],["Cn","Copernicium"],["Nh","Nihonium"],["Fl","Flerovium"],["Mc","Moscovium"],["Lv","Livermorium"],["Ts","Tennessine"],["Og","Oganesson"]
]
function positions() {
 const map: Record<number,{row:number;col:number}>={}
 const row=(period:number, pairs: number[][])=>pairs.forEach(([n,c])=>map[n]={row:period,col:c})
 row(1,[[1,1],[2,18]])
 row(2,[3,4,5,6,7,8,9,10].map((n,i)=>[n,[1,2,13,14,15,16,17,18][i]]))
 row(3,[11,12,13,14,15,16,17,18].map((n,i)=>[n,[1,2,13,14,15,16,17,18][i]]))
 row(4,Array.from({length:18},(_,i)=>[19+i,i+1]))
 row(5,Array.from({length:18},(_,i)=>[37+i,i+1]))
 row(6,[[55,1],[56,2],[57,3],...Array.from({length:15},(_,i)=>[72+i,4+i])])
 row(7,[[87,1],[88,2],[89,3],...Array.from({length:15},(_,i)=>[104+i,4+i])])
 row(8,Array.from({length:14},(_,i)=>[58+i,4+i]))
 row(9,Array.from({length:14},(_,i)=>[90+i,4+i]))
 return map
}
const placement=positions()
export const elements = atoms.map(([symbol,name],i)=>({symbol,name,number:i+1,...placement[i+1]}))
export const shellData: Record<number, number[]> = {
 1:[1],2:[2],3:[2,1],4:[2,2],5:[2,3],6:[2,4],7:[2,5],8:[2,6],9:[2,7],10:[2,8],11:[2,8,1],12:[2,8,2],13:[2,8,3],14:[2,8,4],15:[2,8,5],16:[2,8,6],17:[2,8,7],18:[2,8,8],19:[2,8,8,1],20:[2,8,8,2]
}
export const compounds = [
 {formula:"H₂O",plain:"H2O",name:"Water",atoms:{H:2,O:1},detail:"Two hydrogen atoms share electrons with one oxygen atom. Water is covalently bonded.",zh:"兩個氫原子與一個氧原子共用電子，形成具有共價鍵的水分子。"},
 {formula:"CO₂",plain:"CO2",name:"Carbon dioxide",atoms:{C:1,O:2},detail:"One carbon and two oxygens form a linear molecule with two double bonds.",zh:"一個碳原子與兩個氧原子形成具有兩個雙鍵的線形分子。"},
 {formula:"NaCl",plain:"NaCl",name:"Sodium chloride",atoms:{Na:1,Cl:1},detail:"Sodium transfers an electron to chlorine, forming ions in an extended ionic lattice (not a discrete NaCl molecule).",zh:"鈉將電子轉移給氯，形成離子並排列成離子晶格，而非獨立 NaCl 分子。"},
 {formula:"MgO",plain:"MgO",name:"Magnesium oxide",atoms:{Mg:1,O:1},detail:"Magnesium oxide is an ionic solid with Mg²⁺ and O²⁻ in a lattice.",zh:"氧化鎂是由 Mg²⁺ 與 O²⁻ 所形成的離子晶體。"},
 {formula:"O₂",plain:"O2",name:"Oxygen",atoms:{O:2},detail:"Two oxygen atoms share electrons through a double covalent bond.",zh:"兩個氧原子以共價雙鍵共享電子。"}
] as const
