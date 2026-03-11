declare module 'three/examples/jsm/loaders/FontLoader' {
    import { Loader, LoadingManager } from 'three';

    export class Font {
        constructor(data: any);
        data: any;
        generateShapes(text: string, size: number): any[];
    }

    export class FontLoader extends Loader {
        constructor(manager?: LoadingManager);
        load(url: string, onLoad?: (font: Font) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
        loadAsync(url: string, onProgress?: (event: ProgressEvent) => void): Promise<Font>;
        parse(json: any): Font;
    }
}

declare module 'three/examples/jsm/loaders/FontLoader.js' {
    export * from 'three/examples/jsm/loaders/FontLoader';
}

declare module 'three/examples/jsm/geometries/TextGeometry' {
    import { BufferGeometry } from 'three';
    import { Font } from 'three/examples/jsm/loaders/FontLoader';

    export interface TextGeometryParameters {
        font: Font;
        size?: number;
        height?: number;
        curveSegments?: number;
        bevelEnabled?: boolean;
        bevelThickness?: number;
        bevelSize?: number;
        bevelOffset?: number;
        bevelSegments?: number;
    }

    export class TextGeometry extends BufferGeometry {
        constructor(text: string, parameters: TextGeometryParameters);
        readonly type: string;
        parameters: {
            font: Font;
            size: number;
            height: number;
            curveSegments: number;
            bevelEnabled: boolean;
            bevelThickness: number;
            bevelSize: number;
            bevelOffset: number;
            bevelSegments: number;
        };
    }
}

declare module 'three/examples/jsm/geometries/TextGeometry.js' {
    export * from 'three/examples/jsm/geometries/TextGeometry';
}

declare module 'three/addons/loaders/FontLoader.js' {
    export * from 'three/examples/jsm/loaders/FontLoader';
}

declare module 'three/addons/geometries/TextGeometry.js' {
    export * from 'three/examples/jsm/geometries/TextGeometry';
}
