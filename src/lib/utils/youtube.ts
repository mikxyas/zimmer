// Type definitions for YouTube IFrame API
declare global {
    interface Window {
        YT: {
            Player: new (elementId: string, config: any) => YT.Player;
            PlayerState: {
                PLAYING: number;
                PAUSED: number;
                ENDED: number;
            };
        };
        onYouTubeIframeAPIReady: () => void;
    }
}

// Shared YouTube API loading mechanism
let apiLoadPromise: Promise<typeof window.YT> | null = null;

export function loadYouTubeAPI(): Promise<typeof window.YT> {
    if (apiLoadPromise) {
        return apiLoadPromise;
    }

    apiLoadPromise = new Promise((resolve) => {
        if (window.YT) {
            resolve(window.YT);
            return;
        }

        // Create script only if it doesn't exist
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        window.onYouTubeIframeAPIReady = () => {
            resolve(window.YT);
        };
    });

    return apiLoadPromise;
}

export function extractVideoId(url: string): string {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : '';
}

export function isValidYoutubeUrl(url: string): boolean {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
}
