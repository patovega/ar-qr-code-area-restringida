// ar-gtic.js - Script para aplicación AR del directorio GTIC
// Versión: 1.0
// Descripción: Manejo de eventos de marcador AR, cámara y contacto

// Datos de contacto
const emailContact = "MesaDeAyudaTIC@sgscm.cl";
const phoneNumber = "+56 9 3943 6079";

// Variables para tracking del marcador
let markerVisible = false;
let lastMarkerTime = 0;
let stabilityTimer = null;

/**
 * Función para contactar al soporte técnico
 */
function contactSupport() {
    if (confirm(`¿Deseas contactar a Mesa de Ayuda TIC?\n\nTeléfono: ${phoneNumber}\nEmail: ${emailContact}`)) {
        window.location.href = `tel:${phoneNumber.replace(/\s+/g, '')}`;
    }
}

/**
 * Cargar contenido AR desde archivo externo
 */
async function loadARScene() {
    try {
        console.log('Cargando escena AR...');
        const response = await fetch('./ar-scene.html');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const sceneHTML = await response.text();
        
        const container = document.getElementById('ar-scene-container');
        if (container) {
            container.innerHTML = sceneHTML;
            console.log('Escena AR cargada exitosamente');
            
            // Esperar a que A-Frame procese los elementos antes de inicializar eventos
            waitForARElements()
                .then(() => {
                    console.log('Elementos AR detectados, inicializando eventos...');
                    initializeMarkerEvents();
                })
                .catch(error => {
                    console.error('Timeout esperando elementos AR:', error);
                    // Intentar de todas formas después de más tiempo
                    setTimeout(() => initializeMarkerEvents(), 3000);
                });
        } else {
            console.error('Container ar-scene-container no encontrado');
        }
    } catch (error) {
        console.error('Error cargando escena AR:', error);
        showError('Error de carga', 'No se pudo cargar el contenido AR. Verifica que el archivo ar-scene.html existe.');
    }
}

/**
 * Esperar a que los elementos AR estén disponibles
 */
function waitForARElements() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 30; // 15 segundos máximo
        
        const checkElements = () => {
            const marker = document.querySelector('a-marker');
            const scene = document.querySelector('a-scene');
            const content = document.querySelector('#main-content');
            
            console.log(`Intento ${attempts + 1}: Marker=${!!marker}, Scene=${!!scene}, Content=${!!content}`);
            
            if (marker && scene) {
                // Los elementos principales están disponibles
                resolve();
                return;
            }
            
            attempts++;
            if (attempts >= maxAttempts) {
                reject(new Error('Timeout: No se pudieron encontrar los elementos AR'));
                return;
            }
            
            // Verificar cada 500ms
            setTimeout(checkElements, 500);
        };
        
        checkElements();
    });
}

/**
 * Inicialización cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Iniciando aplicación AR-GTIC...');
    
    // Configuración de cámara mejorada
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices()
            .then(function(devices) {
                const cameras = devices.filter(device => device.kind === 'videoinput');
                console.log('Cámaras disponibles:', cameras.length);
                
                if (cameras.length === 0) {
                    showError('No se detectó ninguna cámara', 'Esta aplicación requiere acceso a la cámara.');
                    return;
                }
                
                // Solicitar cámara con configuración optimizada
                return navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment',
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        frameRate: { ideal: 30, max: 30 }
                    } 
                });
            })
            .then(function(stream) {
                if (stream) {
                    console.log('Acceso a la cámara concedido');
                    stream.getTracks().forEach(track => {
                        track.stop();
                    });
                    initializeMarkerEvents();
                }
            })
            .catch(function(error) {
                console.error('Error al acceder a la cámara:', error);
                handleCameraError(error);
            });
    } else {
        showError('Navegador no compatible', 'Tu navegador no es compatible con la realidad aumentada.');
    }
});

/**
 * Inicializar eventos del marcador AR
 */
function initializeMarkerEvents() {
    const marker = document.querySelector('a-marker');
    const content = document.querySelector('#main-content');
    const scene = document.querySelector('a-scene');
    
    console.log('Verificando elementos AR:');
    console.log('- Marker:', !!marker);
    console.log('- Content:', !!content);
    console.log('- Scene:', !!scene);
    
    if (!marker) {
        console.warn('⚠️ No se encontró el elemento a-marker');
        return;
    }
    
    if (!scene) {
        console.warn('⚠️ No se encontró el elemento a-scene');
        return;
    }
    
    console.log('✅ Configurando eventos del marcador...');
    
    // Eventos de marcador con debouncing
    marker.addEventListener('markerFound', function() {
        console.log('🎯 Marcador encontrado');
        markerVisible = true;
        lastMarkerTime = Date.now();
        
        // Limpiar timer anterior
        if (stabilityTimer) {
            clearTimeout(stabilityTimer);
            stabilityTimer = null;
        }
        
        // Opcional: agregar efectos adicionales cuando se encuentra el marcador
        onMarkerFound();
    });
    
    marker.addEventListener('markerLost', function() {
        console.log('❌ Marcador perdido');
        markerVisible = false;
        
        // Dar un poco de tiempo antes de ocultar completamente
        stabilityTimer = setTimeout(() => {
            if (!markerVisible) {
                console.log('⏱️ Ocultando contenido por pérdida prolongada de marcador');
                onMarkerLost();
            }
        }, 500); // 500ms de gracia
    });
    
    // Evento cuando la escena está lista
    scene.addEventListener('loaded', function() {
        console.log('🌟 A-Frame scene completamente cargada');
    });
    
    console.log('✅ Eventos del marcador configurados exitosamente');
}

/**
 * Callback cuando se encuentra el marcador
 */
function onMarkerFound() {
    // Aquí puedes agregar efectos adicionales cuando se detecta el marcador
    // Por ejemplo: reproducir sonido, cambiar colores, etc.
    console.log('Ejecutando efectos de marcador encontrado');
}

/**
 * Callback cuando se pierde el marcador
 */
function onMarkerLost() {
    // Aquí puedes agregar efectos cuando se pierde el marcador
    console.log('Ejecutando efectos de marcador perdido');
}

/**
 * Manejo de errores de cámara
 * @param {Error} error - Error de la cámara
 */
function handleCameraError(error) {
    let mensaje = '';
    
    switch(error.name) {
        case 'NotFoundError':
            mensaje = 'No se encontró ningún dispositivo de cámara.';
            break;
        case 'NotAllowedError':
            mensaje = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara.';
            break;
        case 'AbortError':
            mensaje = 'Se interrumpió la solicitud de acceso a la cámara.';
            break;
        case 'NotReadableError':
            mensaje = 'La cámara está siendo utilizada por otra aplicación.';
            break;
        case 'OverconstrainedError':
            mensaje = 'La configuración de cámara solicitada no es compatible.';
            break;
        default:
            mensaje = 'Error al acceder a la cámara: ' + error.message;
    }
    
    showError('Error de cámara', mensaje);
}

/**
 * Mostrar pantalla de error
 * @param {string} title - Título del error
 * @param {string} message - Mensaje del error
 */
function showError(title, message) {
    document.body.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: Arial; background: #f5f5f5; min-height: 100vh;">
            <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #d9534f; margin-bottom: 20px;">${title}</h2>
                <p style="margin: 20px 0; color: #333; line-height: 1.5;">${message}</p>
                
                <div style="margin-top: 30px;">
                    <button onclick="location.reload()" 
                            style="padding: 12px 24px; 
                                   background: #4285f4; 
                                   color: white; 
                                   border: none; 
                                   border-radius: 6px; 
                                   cursor: pointer; 
                                   font-size: 16px;
                                   margin-right: 10px;">
                        🔄 Reintentar
                    </button>
                    
                    <button onclick="contactSupport()" 
                            style="padding: 12px 24px; 
                                   background: #28a745; 
                                   color: white; 
                                   border: none; 
                                   border-radius: 6px; 
                                   cursor: pointer; 
                                   font-size: 16px;">
                        📞 Contactar Soporte
                    </button>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; font-size: 14px; color: #666;">
                    <strong>Consejos:</strong><br>
                    • Verifica que tu navegador tenga permisos de cámara<br>
                    • Cierra otras aplicaciones que puedan usar la cámara<br>
                    • Intenta con un navegador diferente (Chrome recomendado)<br>
                    • En móviles, rota la pantalla si hay problemas
                </div>
            </div>
        </div>
    `;
}

/**
 * Optimizaciones de rendimiento y eventos del navegador
 */
window.addEventListener('load', function() {
    console.log('Aplicación AR-GTIC cargada completamente');
    
    // Deshabilitar el scroll en móviles para evitar interferencias
    document.body.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, {passive: false});
    
    // Manejar cambios de orientación en dispositivos móviles
    window.addEventListener('orientationchange', function() {
        console.log('Cambio de orientación detectado, recargando...');
        setTimeout(function() {
            location.reload();
        }, 500);
    });
    
    // Prevenir zoom con pellizco en móviles
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
    console.error('Error global capturado:', e.error);
    console.error('Archivo:', e.filename, 'Línea:', e.lineno);
});

/**
 * Manejo de promesas rechazadas
 */
window.addEventListener('unhandledrejection', function(e) {
    console.error('Promesa rechazada no manejada:', e.reason);
});

/**
 * Función de utilidad para logging con timestamp
 * @param {string} message - Mensaje a registrar
 */
function logWithTimestamp(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] AR-GTIC: ${message}`);
}

/**
 * Función para verificar compatibilidad del navegador
 * @returns {boolean} - True si el navegador es compatible
 */
function checkBrowserCompatibility() {
    const isHttps = location.protocol === 'https:' || location.hostname === 'localhost';
    const hasMediaDevices = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    const hasWebGL = !!window.WebGLRenderingContext;
    
    if (!isHttps) {
        console.warn('ADVERTENCIA: La aplicación AR requiere HTTPS para funcionar correctamente en producción');
    }
    
    return hasMediaDevices && hasWebGL;
}

// Verificar compatibilidad al cargar el script
if (!checkBrowserCompatibility()) {
    console.error('Navegador no compatible con los requisitos de AR');
}

/**
 * Cargar datos del directorio desde JSON
 */
async function loadDirectoryData() {
    try {
        console.log('Cargando datos del directorio...');
        const response = await fetch('gtic-directory.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Datos del directorio cargados:', data);
        return data;
    } catch (error) {
        console.error('Error cargando datos del directorio:', error);
        // Retornar datos por defecto si falla la carga
        return null;
    }
}

/**
 * Actualizar contenido AR con datos del JSON
 */
async function updateARContent() {
    const data = await loadDirectoryData();
    if (!data) return;

    // Si usas el componente personalizado:
    if (window.GTICDirectory) {
        window.GTICDirectory.updateDirectory(data);
    }
    
    // Si usas HTML estático, podrías actualizar los textos dinámicamente:
    setTimeout(() => {
        updateStaticContent(data);
    }, 2000);
}

/**
 * Actualizar contenido estático con datos JSON
 */
function updateStaticContent(data) {
    try {
        // Actualizar título si existe
        const titleElement = document.querySelector('a-text[value*="Gerencia"]');
        if (titleElement && data.title) {
            titleElement.setAttribute('value', data.title);
        }

        // Actualizar posiciones si existen
        const textElements = document.querySelectorAll('a-text');
        if (data.positions && textElements.length > 0) {
            data.positions.forEach((position, index) => {
                // Buscar elementos que contengan el nombre o título
                textElements.forEach(element => {
                    const currentValue = element.getAttribute('value');
                    if (currentValue && (
                        currentValue.includes(position.name) ||
                        currentValue.includes(position.title.substring(0, 15))
                    )) {
                        // Actualizar si es necesario
                        if (currentValue !== position.title && currentValue !== position.name) {
                            console.log('Actualizando elemento AR:', currentValue);
                        }
                    }
                });
            });
        }

        console.log('Contenido AR actualizado con datos JSON');
    } catch (error) {
        console.error('Error actualizando contenido AR:', error);
    }
}

// Exportar funciones principales para uso global (si es necesario)
window.ARApp = {
    contactSupport,
    checkBrowserCompatibility,
    logWithTimestamp,
    loadARScene,
    loadDirectoryData,
    updateARContent
};