// ar-gtic.js - Script para aplicación AR del directorio GTIC
// Versión: 2.0 - Optimizado para detección HIRO
// Descripción: Manejo de eventos de marcador AR, cámara y contacto

// Datos de contacto
const emailContact = "MesaDeAyudaTIC@sgscm.cl";
const phoneNumber = "+56 9 3943 6079";

// Variables para tracking del marcador
let markerVisible = false;
let lastMarkerTime = 0;
let stabilityTimer = null;
let arSceneLoaded = false;
let loadAttempts = 0;
const maxLoadAttempts = 3;

/**
 * Función para contactar al soporte técnico
 */
function contactSupport() {
    if (confirm(`¿Deseas contactar a Mesa de Ayuda TIC?\n\nTeléfono: ${phoneNumber}\nEmail: ${emailContact}`)) {
        window.location.href = `tel:${phoneNumber.replace(/\s+/g, '')}`;
    }
}

/**
 * Cargar contenido AR desde archivo externo con reintentos
 */
async function loadARScene() {
    loadAttempts++;
    
    try {
        console.log(`🔄 Intento ${loadAttempts}: Cargando escena AR desde ar-scene.html...`);
        window.updateDebug && window.updateDebug('content', `Cargando... (intento ${loadAttempts})`, '');
        
        // Verificar que el container existe
        const container = document.getElementById('ar-scene-container');
        if (!container) {
            throw new Error('Container ar-scene-container no encontrado en el DOM');
        }
        
        // Cargar archivo ar-scene.html
        const response = await fetch('./ar-scene.html', {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const sceneHTML = await response.text();
        console.log('✅ Archivo ar-scene.html cargado exitosamente');
        console.log('   - Tamaño:', sceneHTML.length, 'caracteres');
        console.log('   - Contiene a-scene:', sceneHTML.includes('<a-scene'));
        console.log('   - Contiene marcador HIRO:', sceneHTML.includes('preset="hiro"'));
        
        window.updateDebug && window.updateDebug('content', 'Archivo cargado', 'ok');
        
        // Validar contenido
        if (!sceneHTML.includes('<a-scene')) {
            throw new Error('El archivo ar-scene.html no contiene una escena A-Frame válida');
        }
        
        if (!sceneHTML.includes('preset="hiro"')) {
            console.warn('⚠️ Advertencia: No se detectó marcador HIRO en ar-scene.html');
        }
        
        // Insertar el contenido en el container
        container.innerHTML = sceneHTML;
        console.log('✅ Contenido HTML insertado en el container');
        
        // Esperar un momento para que el DOM se actualice
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verificar que los elementos se insertaron correctamente
        const insertedScene = document.querySelector('a-scene');
        if (!insertedScene) {
            throw new Error('Error: a-scene no se insertó correctamente en el DOM');
        }
        
        window.updateDebug && window.updateDebug('scene', 'Elementos insertados', 'ok');
        console.log('✅ Confirmado: a-scene insertado en DOM');
        
        // Esperar a que A-Frame procese los elementos
        console.log('⏳ Esperando a que A-Frame procese los elementos...');
        
        try {
            // Esperar a que A-Frame esté completamente listo
            await waitForAFrameReady();
            console.log('✅ A-Frame está listo');
            
            // Tiempo adicional para estabilización
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Esperar a que los elementos específicos estén disponibles
            await waitForARElements();
            console.log('✅ Elementos AR detectados');
            
            // Inicializar eventos del marcador
            initializeMarkerEvents();
            console.log('🎯 ¡Sistema AR completamente inicializado!');
            
            arSceneLoaded = true;
            window.updateDebug && window.updateDebug('scene', 'Completamente inicializado', 'ok');
            
        } catch (error) {
            console.error('⚠️ Error esperando elementos AR:', error);
            window.updateDebug && window.updateDebug('scene', `Error: ${error.message}`, 'error');
            
            // Diagnóstico detallado
            performDetailedDiagnosis();
            
            // Intento de recuperación
            if (loadAttempts < maxLoadAttempts) {
                console.log(`🔄 Intentando recuperación automática (${loadAttempts}/${maxLoadAttempts})...`);
                setTimeout(() => {
                    loadARScene();
                }, 2000);
                return;
            } else {
                console.log('🆘 Ejecutando inicialización de emergencia...');
                setTimeout(() => {
                    initializeMarkerEvents();
                }, 3000);
            }
        }
        
    } catch (error) {
        console.error(`❌ Error cargando escena AR (intento ${loadAttempts}):`, error);
        window.updateDebug && window.updateDebug('content', `Error: ${error.message}`, 'error');
        
        // Reintentar si no hemos alcanzado el máximo
        if (loadAttempts < maxLoadAttempts) {
            console.log(`🔄 Reintentando en 3 segundos... (${loadAttempts}/${maxLoadAttempts})`);
            setTimeout(() => {
                loadARScene();
            }, 3000);
        } else {
            showError('Error de carga', `No se pudo cargar el contenido AR después de ${maxLoadAttempts} intentos: ${error.message}`);
        }
    }
}

/**
 * Realizar diagnóstico detallado del estado actual
 */
function performDetailedDiagnosis() {
    console.log('🔍 === DIAGNÓSTICO DETALLADO ===');
    
    // Verificar elementos DOM
    const scene = document.querySelector('a-scene');
    const marker = document.querySelector('a-marker');
    const content = document.querySelector('#main-content');
    const hiróMarker = document.querySelector('a-marker[preset="hiro"]');
    
    console.log('📊 Estado de elementos DOM:');
    console.log('- a-scene:', !!scene, scene ? '✅' : '❌');
    console.log('- a-marker:', !!marker, marker ? '✅' : '❌');
    console.log('- marcador HIRO:', !!hiróMarker, hiróMarker ? '✅' : '❌');
    console.log('- #main-content:', !!content, content ? '✅' : '❌');
    
    // Verificar A-Frame
    console.log('🎮 Estado de A-Frame:');
    console.log('- window.AFRAME:', !!window.AFRAME);
    console.log('- AFRAME.version:', window.AFRAME ? window.AFRAME.version : 'N/A');
    console.log('- AFRAME.scenes:', window.AFRAME && window.AFRAME.scenes ? window.AFRAME.scenes.length : 0);
    
    // Verificar escena específica
    if (scene) {
        console.log('📱 Estado de la escena:');
        console.log('- hasLoaded:', scene.hasLoaded);
        console.log('- is:', scene.is);
        console.log('- object3D:', !!scene.object3D);
        
        // Verificar sistema arjs
        if (scene.systems && scene.systems.arjs) {
            console.log('- Sistema AR.js:', !!scene.systems.arjs);
        }
    }
    
    // Contar todos los elementos A-Frame
    const allAFrameElements = document.querySelectorAll('[geometry], [material], a-entity, a-plane, a-text, a-box, a-marker, a-scene');
    console.log('📦 Total elementos A-Frame encontrados:', allAFrameElements.length);
    
    if (allAFrameElements.length > 0) {
        console.log('📝 Lista de elementos:');
        allAFrameElements.forEach((el, i) => {
            const id = el.getAttribute('id') || 'sin id';
            const preset = el.getAttribute('preset') || '';
            console.log(`   ${i + 1}. ${el.tagName}: ${id} ${preset}`);
        });
    }
}

/**
 * Esperar a que los elementos AR estén disponibles
 */
function waitForARElements() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 40; // 20 segundos máximo
        
        const checkElements = () => {
            const marker = document.querySelector('a-marker[preset="hiro"]');
            const scene = document.querySelector('a-scene');
            const content = document.querySelector('#main-content');
            
            console.log(`🔍 Verificación ${attempts + 1}/${maxAttempts}: Marker=${!!marker}, Scene=${!!scene}, Content=${!!content}`);
            
            // Verificar que A-Frame haya procesado completamente los elementos
            if (marker && scene) {
                // Verificar que la escena tenga el sistema AR.js
                if (scene.systems && scene.systems.arjs) {
                    console.log('✅ Sistema AR.js detectado en la escena');
                    resolve();
                    return;
                } else if (scene.hasLoaded) {
                    console.log('✅ Escena cargada (sin confirmar AR.js)');
                    resolve();
                    return;
                }
            }
            
            attempts++;
            if (attempts >= maxAttempts) {
                reject(new Error(`Timeout: No se pudieron encontrar los elementos AR después de ${maxAttempts/2} segundos`));
                return;
            }
            
            // Verificar cada 500ms
            setTimeout(checkElements, 500);
        };
        
        // Comenzar verificación inmediatamente
        checkElements();
    });
}

/**
 * Esperar a que A-Frame esté completamente cargado
 */
function waitForAFrameReady() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 30;
        
        const checkAFrame = () => {
            attempts++;
            
            // Verificar si A-Frame está disponible
            if (!window.AFRAME) {
                if (attempts >= maxAttempts) {
                    console.warn('⚠️ A-Frame no se cargó en el tiempo esperado');
                    resolve(); // Resolver de todas formas
                    return;
                }
                setTimeout(checkAFrame, 200);
                return;
            }
            
            // Si A-Frame ya tiene escenas cargadas
            if (window.AFRAME.scenes && window.AFRAME.scenes.length > 0) {
                const scene = window.AFRAME.scenes[0];
                
                if (scene.hasLoaded) {
                    console.log('✅ A-Frame scene ya estaba cargada');
                    resolve();
                    return;
                }
                
                // Escuchar evento de carga de la escena
                scene.addEventListener('loaded', () => {
                    console.log('✅ A-Frame scene loaded event triggered');
                    resolve();
                }, { once: true });
                
                // Timeout de seguridad
                setTimeout(() => {
                    console.log('⏰ Timeout de A-Frame, continuando...');
                    resolve();
                }, 5000);
            } else {
                // Esperar a que se cree una escena
                if (attempts >= maxAttempts) {
                    console.log('⚠️ No se detectaron escenas A-Frame, continuando...');
                    resolve();
                    return;
                }
                setTimeout(checkAFrame, 200);
            }
        };
        
        checkAFrame();
    });
}

/**
 * Inicializar eventos del marcador AR con verificación robusta
 */
function initializeMarkerEvents() {
    console.log('🎯 Iniciando configuración de eventos del marcador...');
    window.updateDebug && window.updateDebug('marker', 'Configurando eventos...', '');
    
    // Verificar primero si hay contenido AR cargado
    const container = document.getElementById('ar-scene-container');
    const marker = document.querySelector('a-marker[preset="hiro"]');
    const scene = document.querySelector('a-scene');
    
    // Si no hay marcador pero sí hay container con loading, necesitamos cargar el contenido
    const loadingIndicator = document.getElementById('loading-indicator');
    if (!marker && container && loadingIndicator) {
        console.log('🚨 DETECTADO: Container con loading, forzando carga de ar-scene.html');
        loadARScene();
        return;
    }
    
    const content = document.querySelector('#main-content');
    
    console.log('🔍 Verificando elementos AR para eventos:');
    console.log('- Marcador HIRO:', !!marker, marker ? '✅' : '❌');
    console.log('- Contenido principal:', !!content, content ? '✅' : '❌');
    console.log('- Escena:', !!scene, scene ? '✅' : '❌');
    
    if (!marker) {
        console.error('⚠️ No se encontró el marcador HIRO (preset="hiro")');
        window.updateDebug && window.updateDebug('marker', 'Marcador HIRO no encontrado', 'error');
        
        // Buscar cualquier marcador como fallback
        const anyMarker = document.querySelector('a-marker');
        if (anyMarker) {
            console.log('🔍 Encontrado marcador alternativo:', anyMarker.getAttribute('preset') || anyMarker.getAttribute('type'));
        }
        
        // Mostrar todos los elementos A-Frame para diagnóstico
        const allAFrameElements = document.querySelectorAll('a-marker, a-entity, a-scene');
        console.log('🔍 Elementos A-Frame encontrados:', allAFrameElements.length);
        allAFrameElements.forEach((el, i) => {
            const id = el.getAttribute('id') || 'sin id';
            const preset = el.getAttribute('preset') || el.getAttribute('type') || '';
            console.log(`   ${i + 1}. ${el.tagName}: ${id} ${preset}`);
        });
        
        console.error('🚨 PROBLEMA: Marcador HIRO no encontrado - verificar ar-scene.html');
        return;
    }
    
    if (!scene) {
        console.error('⚠️ No se encontró el elemento a-scene');
        window.updateDebug && window.updateDebug('scene', 'a-scene no encontrado', 'error');
        return;
    }
    
    console.log('✅ Todos los elementos AR encontrados correctamente');
    
    // Verificar si el marcador ya tiene eventos configurados
    if (marker._eventConfigured) {
        console.log('⚠️ Eventos ya configurados anteriormente, saltando...');
        window.updateDebug && window.updateDebug('marker', 'Eventos ya configurados', 'warning');
        return;
    }
    
    console.log('🎯 Configurando eventos del marcador HIRO...');
    
    // Eventos del marcador con debouncing mejorado
    marker.addEventListener('markerFound', function() {
        console.log('🎯 ¡Marcador HIRO detectado!');
        markerVisible = true;
        lastMarkerTime = Date.now();
        
        window.updateDebug && window.updateDebug('marker', '¡DETECTADO!', 'ok');
        
        // Limpiar timer anterior
        if (stabilityTimer) {
            clearTimeout(stabilityTimer);
            stabilityTimer = null;
        }
        
        // Ejecutar efectos de marcador encontrado
        onMarkerFound();
        
        // Log detallado del contenido
        const content = document.querySelector('#main-content');
        if (content) {
            console.log('📊 Estado del contenido al detectar marcador:');
            console.log('   - Posición:', content.getAttribute('position'));
            console.log('   - Escala:', content.getAttribute('scale'));
            console.log('   - Visible:', content.getAttribute('visible'));
            console.log('   - Rotación:', content.getAttribute('rotation'));
        }
    });
    
    marker.addEventListener('markerLost', function() {
        console.log('❌ Marcador HIRO perdido');
        markerVisible = false;
        
        window.updateDebug && window.updateDebug('marker', 'Perdido, buscando...', 'warning');
        
        // Dar un poco de tiempo antes de ocultar completamente (debouncing)
        stabilityTimer = setTimeout(() => {
            if (!markerVisible) {
                console.log('⏱️ Marcador perdido por tiempo prolongado');
                onMarkerLost();
            }
        }, 1000); // 1 segundo de gracia
    });
    
    // Eventos de la escena
    scene.addEventListener('loaded', function() {
        console.log('🌟 A-Frame scene completamente cargada');
        window.updateDebug && window.updateDebug('scene', 'Scene loaded event', 'ok');
    });
    
    // Evento cuando el sistema AR.js está listo
    scene.addEventListener('arjs-ready', function() {
        console.log('🎮 AR.js sistema completamente inicializado');
        window.updateDebug && window.updateDebug('marker', 'AR.js listo, detectando...', '');
    });
    
    // Marcar como configurado
    marker._eventConfigured = true;
    
    console.log('✅ Eventos del marcador configurados exitosamente');
    window.updateDebug && window.updateDebug('marker', 'Eventos configurados, buscando...', '');
    
    // Verificación periódica del estado del marcador
    setInterval(() => {
        if (!markerVisible && marker) {
            // Verificar si el marcador tiene el componente arjs correctamente inicializado
            if (marker.components && marker.components.arjs) {
                const arjsComponent = marker.components.arjs;
                if (arjsComponent.data) {
                    console.log('🔍 Marcador HIRO activo, buscando patrón...');
                }
            }
        }
    }, 10000); // Cada 10 segundos
}

/**
 * Callback cuando se encuentra el marcador
 */
function onMarkerFound() {
    console.log('🎯 Ejecutando efectos de marcador encontrado');
    
    // Verificar y mostrar contenido
    const content = document.querySelector('#main-content');
    if (content) {
        console.log('✅ Contenido principal encontrado y visible');
        
        // Asegurar que el contenido sea visible
        content.setAttribute('visible', 'true');
        
        // Verificar escala
        const currentScale = content.getAttribute('scale');
        if (!currentScale || currentScale === '0 0 0') {
            content.setAttribute('scale', '1 1 1');
            console.log('🔧 Escala del contenido ajustada a 1 1 1');
        }
        
        // Opcional: agregar efecto de aparición suave
        content.setAttribute('animation', 'property: scale; from: 0.1 0.1 0.1; to: 1 1 1; dur: 500');
        
    } else {
        console.error('❌ No se encontró #main-content cuando se detectó el marcador');
    }
    
    // Verificar elementos de prueba
    const testBox = document.querySelector('a-box[color="red"]');
    if (testBox) {
        console.log('✅ Elemento de prueba (cubo rojo) detectado');
    }
    
    const testText = document.querySelector('a-text[value*="FUNCIONA"]');
    if (testText) {
        console.log('✅ Texto de prueba detectado');
    }
}

/**
 * Callback cuando se pierde el marcador
 */
function onMarkerLost() {
    console.log('🔍 Marcador perdido por tiempo prolongado - ejecutando efectos');
    
    // Opcional: agregar efectos cuando se pierde el marcador
    const content = document.querySelector('#main-content');
    if (content) {
        // Efecto sutil de desvanecimiento (opcional)
        // content.setAttribute('animation', 'property: scale; to: 0.8 0.8 0.8; dur: 200');
    }
}

/**
 * Inicialización cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación AR-GTIC...');
    console.log('📋 Estructura de archivos detectada:');
    console.log('   - css/ar-gtic.css');
    console.log('   - js/ar-gtic.js');
    console.log('   - ar-scene.html');
    
    // Verificar si necesitamos cargar contenido AR dinámicamente
    const container = document.getElementById('ar-scene-container');
    const existingScene = document.querySelector('a-scene');
    
    if (container && !existingScene) {
        console.log('📋 Modo de carga dinámica detectado - contenedor vacío');
        console.log('🔄 Se procederá a cargar ar-scene.html');
        
        // Verificar disponibilidad del archivo antes de proceder
        fetch('./ar-scene.html', { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    console.log('✅ Archivo ar-scene.html accesible');
                    window.updateDebug && window.updateDebug('content', 'Archivo accesible', 'ok');
                } else {
                    console.warn('⚠️ Archivo ar-scene.html no accesible:', response.status);
                    window.updateDebug && window.updateDebug('content', `HTTP ${response.status}`, 'error');
                }
            })
            .catch(error => {
                console.error('❌ Error verificando ar-scene.html:', error);
                window.updateDebug && window.updateDebug('content', 'No accesible', 'error');
            });
            
    } else if (existingScene) {
        console.log('📋 Contenido AR estático detectado - inicialización directa');
        arSceneLoaded = true;
        // Si ya hay contenido AR estático, inicializar directamente
        setTimeout(() => {
            console.log('🔄 Inicializando eventos para contenido estático...');
            initializeMarkerEvents();
        }, 1500);
        return;
    }
    
    // Configuración de cámara
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices()
            .then(function(devices) {
                const cameras = devices.filter(device => device.kind === 'videoinput');
                console.log('📷 Cámaras disponibles:', cameras.length);
                
                if (cameras.length === 0) {
                    showError('No se detectó ninguna cámara', 'Esta aplicación requiere acceso a la cámara.');
                    return;
                }
                
                // Solicitar cámara con configuración optimizada para AR
                return navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment', // Cámara trasera preferida
                        width: { ideal: 640, max: 1280 },
                        height: { ideal: 480, max: 720 },
                        frameRate: { ideal: 30, max: 60 }
                    } 
                });
            })
            .then(function(stream) {
                if (stream) {
                    console.log('✅ Acceso a la cámara concedido');
                    console.log('📊 Configuración de stream:', {
                        width: stream.getVideoTracks()[0].getSettings().width,
                        height: stream.getVideoTracks()[0].getSettings().height,
                        frameRate: stream.getVideoTracks()[0].getSettings().frameRate
                    });
                    
                    // Cerrar stream de prueba
                    stream.getTracks().forEach(track => {
                        track.stop();
                    });
                    
                    // Inicializar AR después de confirmar cámara
                    setTimeout(() => {
                        if (!arSceneLoaded) {
                            loadARScene();
                        } else {
                            initializeMarkerEvents();
                        }
                    }, 1000);
                }
            })
            .catch(function(error) {
                console.error('❌ Error al acceder a la cámara:', error);
                handleCameraError(error);
            });
    } else {
        showError('Navegador no compatible', 'Tu navegador no es compatible con la realidad aumentada.');
    }
});

/**
 * Manejo de errores de cámara
 */
function handleCameraError(error) {
    let mensaje = '';
    
    switch(error.name) {
        case 'NotFoundError':
            mensaje = 'No se encontró ningún dispositivo de cámara.';
            break;
        case 'NotAllowedError':
            mensaje = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara y recarga la página.';
            break;
        case 'AbortError':
            mensaje = 'Se interrumpió la solicitud de acceso a la cámara.';
            break;
        case 'NotReadableError':
            mensaje = 'La cámara está siendo utilizada por otra aplicación.';
            break;
        case 'OverconstrainedError':
            mensaje = 'La configuración de cámara solicitada no es compatible con tu dispositivo.';
            break;
        default:
            mensaje = 'Error al acceder a la cámara: ' + error.message;
    }
    
    showError('Error de cámara', mensaje);
}

/**
 * Mostrar pantalla de error
 */
function showError(title, message) {
    document.body.innerHTML = `
        <div class="error-screen">
            <div class="error-container">
                <h2 class="error-title">${title}</h2>
                <p class="error-message">${message}</p>
                
                <div class="error-buttons">
                    <button onclick="location.reload()" class="error-btn primary">
                        🔄 Reintentar
                    </button>
                    
                    <button onclick="contactSupport()" class="error-btn success">
                        📞 Contactar Soporte
                    </button>
                </div>
                
                <div class="error-tips">
                    <strong>Consejos para el marcador HIRO:</strong><br>
                    • Descarga un marcador HIRO oficial desde AR.js<br>
                    • Imprímelo en papel blanco, tamaño A4<br>
                    • Asegúrate de que esté bien iluminado<br>
                    • Mantén el marcador plano y sin arrugas<br>
                    • Usa Chrome o Firefox para mejor compatibilidad<br>
                    • Mantén distancia de 20-50cm de la cámara
                </div>
            </div>
        </div>
    `;
}

/**
 * Optimizaciones de rendimiento y eventos del navegador
 */
window.addEventListener('load', function() {
    console.log('📱 Aplicación AR-GTIC cargada completamente');
    
    // Deshabilitar el scroll en móviles para evitar interferencias
    document.body.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, {passive: false});
    
    // Manejar cambios de orientación en dispositivos móviles
    window.addEventListener('orientationchange', function() {
        console.log('🔄 Cambio de orientación detectado, recargando en 1 segundo...');
        setTimeout(function() {
            location.reload();
        }, 1000);
    });
    
    // Prevenir zoom con pellizco en móviles
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Prevenir gestos de zoom
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });
    
    document.addEventListener('gesturechange', function(e) {
        e.preventDefault();
    });
    
    document.addEventListener('gestureend', function(e) {
        e.preventDefault();
    });
});

/**
 * Manejo de errores globales
 */
window.addEventListener('error', function(e) {
    console.error('❌ Error global capturado:', e.error);
    console.error('   Archivo:', e.filename, 'Línea:', e.lineno);
    
    // Si es un error de A-Frame o AR.js, intentar diagnóstico
    if (e.error && (e.error.message.includes('aframe') || e.error.message.includes('arjs'))) {
        console.log('🔧 Error relacionado con A-Frame/AR.js detectado');
        setTimeout(performDetailedDiagnosis, 1000);
    }
});

/**
 * Manejo de promesas rechazadas
 */
window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Promesa rechazada no manejada:', e.reason);
});

/**
 * Función de utilidad para logging con timestamp
 */
function logWithTimestamp(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] AR-GTIC: ${message}`);
}

/**
 * Función para verificar compatibilidad del navegador
 */
function checkBrowserCompatibility() {
    const isHttps = location.protocol === 'https:' || location.hostname === 'localhost';
    const hasMediaDevices = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    const hasWebGL = !!window.WebGLRenderingContext;
    const hasWebGL2 = !!window.WebGL2RenderingContext;
    
    console.log('🔍 Verificación de compatibilidad:');
    console.log('   - HTTPS/localhost:', isHttps ? '✅' : '❌');
    console.log('   - MediaDevices API:', hasMediaDevices ? '✅' : '❌');
    console.log('   - WebGL:', hasWebGL ? '✅' : '❌');
    console.log('   - WebGL2:', hasWebGL2 ? '✅' : '❌');
    console.log('   - User Agent:', navigator.userAgent);
    
    if (!isHttps) {
        console.warn('⚠️ ADVERTENCIA: La aplicación AR requiere HTTPS para funcionar correctamente en producción');
    }
    
    return hasMediaDevices && hasWebGL && isHttps;
}

// Verificar compatibilidad al cargar el script
if (!checkBrowserCompatibility()) {
    console.error('❌ Navegador no compatible con los requisitos de AR');
    showError('Navegador no compatible', 'Tu navegador no cumple con los requisitos mínimos para AR.');
}

/**
 * Exportar funciones principales para uso global
 */
window.ARApp = {
    contactSupport,
    checkBrowserCompatibility,
    logWithTimestamp,
    loadARScene,
    performDetailedDiagnosis,
    initializeMarkerEvents,
    forceReload: () => location.reload()
};

// Funciones de debug disponibles en consola
console.log('🔧 Funciones de debug disponibles en window.ARApp:');
console.log('   - ARApp.loadARScene(): Forzar carga de AR');
console.log('   - ARApp.performDetailedDiagnosis(): Diagnóstico completo');
console.log('   - ARApp.initializeMarkerEvents(): Reinicializar eventos');
console.log('   - ARApp.forceReload(): Recargar página');

console.log('📱 AR-GTIC script cargado completamente - Versión 2.0');