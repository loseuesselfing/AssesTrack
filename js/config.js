// Constants: daily limit, assessment types, grade sections, subject lists, demo accounts.

export const MAX=3,DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday'];

export const TYPES={
 quiz:{label:'Quiz',chip:'bg-sky-100 text-sky-800 border-sky-300',bar:'bg-sky-500'},
 long:{label:'Long Quiz',chip:'bg-violet-100 text-violet-800 border-violet-300',bar:'bg-violet-600'},
 task:{label:'Task',chip:'bg-amber-100 text-amber-900 border-amber-300',bar:'bg-amber-500'},
 project:{label:'Project',chip:'bg-rose-100 text-rose-800 border-rose-300',bar:'bg-rose-500'}};

export const SECTIONS={7:['Ruby','Diamond','Emerald'],8:['Waling waling','Jasmin','Sampaguita'],9:['Lithium','Sodium','Potassium'],10:['Graviton','Muon','Gluon'],11:['Polaris','Sirius','Rigel'],12:['A','B','C']};

const core=n=>['Mathematics '+n,'Computer Science '+n,'English '+n,'Filipino '+n,'Social Science '+n,'Values Education '+n];

export const SUBJECTS={7:['Integrated Science 1',...core(1),'Art, Drafting & Technology 1','PE, Health & Music 1'],8:['Integrated Science 2',...core(2),'Art, Drafting & Technology 2','PE, Health & Music 2'],
 9:['Biology 1','Chemistry 1','Physics 1',...core(3)],10:['Biology 2','Chemistry 2','Physics 2',...core(4)],11:[],12:[]};

export const ACC={teacher:{pw:'teacher123',name:'Ms. Dela Cruz'},admin:{pw:'admin123',name:'Admin Office'},scholar:{pw:'scholar123'}};

export const ROLE={teacher:'Teacher',admin:'Admin',scholar:'Scholar'};

export const BADGE={teacher:'Teacher: can schedule',admin:'Admin: full oversight',scholar:'Scholar / Staff: view only'};

export const EMOJI=['👍','✅','👀','😰'],KD='assestrack_v3',KU='assestrack_user_v3',KT='assestrack_theme';

export const EVC={holiday:'bg-red-50 text-red-800 border-red-300',event:'bg-blue-50 text-blue-900 border-blue-200'};
