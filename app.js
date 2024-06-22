require('dotenv').config();
const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MongoAdapter = require('@bot-whatsapp/database/mongo');

const response = {
    menu: [
        '🔹✍ Escribe un número de las opciones para una respuesta rápida:',
        '👉 *1* Información sobre precios y Horarios',
        '👉 *2* Clases y actividades',
        '👉 *3* Servicios adicionales',
        '👉 *4* Dirección para saber dónde estamos ubicados',
    ],
    info: [
        '📊 *Precios:*',
        '💪 Mensualidad para 1 persona: 70,000 COP.',
        '',
        '🏋🏽‍♂️🏋🏽 Mensualidad para 2 personas: 65,000 COP cada uno.',
        '',
        '⚡ Mensualidad para 3 o más personas: 60,000 COP cada uno.',
        '',
        '🔱 15 días: 40,000 COP.',
        '',
        '🔱 Semana: 30,000 COP.',
        '',
        '🔱 Clase individual: 8,000 COP',
        '',
        '➡️ ¿Te gustaría más información sobre clases y Actividades? Oprime *2*.',
        '',
        '➡️ Servicios adicionales 3.',
        '',
        '➡️ Dirección: Oprime *4*.'
    ],
    class: [
        '🔥💪🏼🎧',
        '📅 *Clases y actividades:*',
        '',
        '🏋🏽 Clase de rumba: Lunes a las 7:15 pm.',
        '',
        '🏋🏽 Clase de running y funcional: Martes a las 7:00 pm.',
        '',
        '➡️ ¿Te gustaría más información sobre nuestros servicios adicionales? Oprime *3* o *1* para saber sobre precios.',
        '',
        '➡️ Dirección: Oprime *4*.'
    ],
    servicios: [
        '💼 *Servicios adicionales:*',
        'Escribe la palabra que está en color: (*negrita*) para obtener más información:',
        '',
        '*Asesoría*: Asesoría nutricional personalizada.',
        '',
        '*Plan*: Plan personalizado de entrenamiento.',
        '',
        '*Venta*: Venta de suplementación fitness.',
        '',
        '🔙 Para regresar al menú principal, escribe "menu".',
        '➡️ si quieres saber la Dirección: Oprime *4*.',
    ],
    direccion: [
        '📍 *Dirección:*',
        'Nos encontramos en [Corales manzana 46 casa #13 piso 2].',
        '🔙 Para regresar al menú principal, escribe "menu".'
    ]
};

const flowGracias = addKeyword(['gracias', 'muchas gracias', 'bueno', 'adios', 'thank you', 'thanks'])
    .addAnswer([
        '😃 ¡Es un placer ayudarte!',
    ]);

const flowInfo = addKeyword(['1']).addAnswer(response.info);

const flowClases = addKeyword(['2']).addAnswer(response.class);

const flowService = addKeyword(['3']).addAnswer(response.servicios, { capture: true }, async (ctx, { fallBack, flowDynamic }) => {
    console.log(ctx); // Imprimir el contexto en la consola
    switch (ctx.body.toLowerCase()) {
        case 'asesor':
        case 'asesoría nutricional personalizada':
            await flowDynamic('🍏 En unos minutos te comunico con un asesor para la asesoría nutricional personalizada.');
            break;
        case 'plan':
        case 'plan personalizado de entrenamiento':
            await flowDynamic('🏋️ En unos minutos te comunico con un asesor para el plan personalizado de entrenamiento.');
            break;
        case 'venta':
        case 'venta de suplementación fitness':
            await flowDynamic('💊 En unos minutos te comunico con un asesor para la venta de suplementación fitness.');
            break;
        default:
            return fallBack('❌ Respuesta no válida, por favor selecciona una de las opciones.');
    }
    return true; // Para asegurar que la promesa devuelve algo
});

const flowDireccion = addKeyword(['4']).addAnswer(response.direccion);

const flowPrincipal = addKeyword(['hola', 'holi', 'buen dia', 'buen día', 'hola muy buen dia', 'hola muy buen día', 'hola buenos días', 'buenas tardes', 'que tal', 'cristian', 'hola cristian', 'parcero', 'mijo', 'buenas noches', 'disculpe buenas', 'buenos día', 'buenos dia', 'hola me interesa saber precios del gimnasio', 'hola me interesa saber precios del gym', 'que tal'])
    .addAnswer('😃 ¡Hola! ¿Cómo va todo? Bienvenido/a al Gimnasio *Desafío Fitness corales*. ¿En qué puedo apoyarte hoy?',)
    .addAnswer(response.menu);

const menuFlow = addKeyword(['menu'])
    .addAnswer(response.menu, { capture: true }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
        if (!["1", "2", "3", "4"].includes(ctx.body)) {
            return fallBack("❌ Respuesta no válida, por favor selecciona una de las opciones.");
        }
        switch (ctx.body) {
            case "1":
                return gotoFlow(flowInfo);
            case "2":
                return gotoFlow(flowClases);
            case "3":
                return gotoFlow(flowService);
            case "4":
                return gotoFlow(flowDireccion);
            default:
                return await flowDynamic("🔚 Saliendo... Puedes volver a acceder a este menú escribiendo 'menu'.");
        }
    });

const main = async () => {
    const adapterDB = new MongoAdapter({
        dbUri: process.env.MONGODB_URI,  // Utiliza la variable de entorno aquí
        dbName: "GymBot"
    });
    const adapterFlow = createFlow([flowPrincipal, menuFlow, flowInfo, flowClases, flowService, flowDireccion, flowGracias]);
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
};

main();
