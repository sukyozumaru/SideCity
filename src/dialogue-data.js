export const TOPICS={greeting:'Saludar y compartir',feelings:'Escuchar cómo está',plans:'Hablar del huerto'};
export const LINES={
 gestureWater:'Señala el agua y ofrece compartir el cuenco.',gestureReply:'Asiente y acerca las manos: entiende el gesto.',
 greeting:'Qué bien encontrarte. ¿Cómo va el día?',greetingReply:'Me alegra tener a alguien cerca.',
 tired:'Me pesan las piernas. Necesito parar un poco.',tiredReply:'Descansa. El trabajo puede esperar.',
 thirsty:'Voy a buscar agua antes de seguir.',thirstyReply:'Sí. Te acompaño hasta la orilla.',
 lonely:'Hoy me vendría bien un rato de compañía.',lonelyReply:'Podemos quedarnos aquí un momento.',
 calm:'Estoy a gusto. El valle ya se siente nuestro.',calmReply:'A mí también me gusta lo que estamos haciendo.',
 plans:'Si cuidamos los brotes, tendremos comida aquí mismo.',plansReply:'Yo puedo llevar agua. Tú mira cómo crecen.',
 noGarden:'Podríamos dejar un poco de tierra para sembrar.',noGardenReply:'Busquemos un sitio con agua cerca.',
 harvest:'Ya salieron raíces. Alcanza para compartir.',harvestReply:'Guardemos también semillas para la próxima vez.',
};
export function languageStage(exchanges){return exchanges<3?'Gestos compartidos':exchanges<8?'Primeras palabras':exchanges<20?'Frases cortas':'Relatos del valle';}
export function conversationLines(sim,actor,other,topic){
 if(sim.culture.exchanges<3)return['gestureWater','gestureReply'];
 if(topic==='feelings'){if(other.needs.water<35)return['thirsty','thirstyReply'];if(other.needs.energy<40)return['tired','tiredReply'];if(other.company<35)return['lonely','lonelyReply'];return['calm','calmReply'];}
 if(topic==='plans'){if(sim.plots.some(p=>p.harvests))return['harvest','harvestReply'];return sim.plots.length?['plans','plansReply']:['noGarden','noGardenReply'];}
 return['greeting','greetingReply'];
}
