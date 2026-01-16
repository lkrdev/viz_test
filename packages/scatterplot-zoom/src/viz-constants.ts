
// Visualization Constants
export const VIZ_ID = 'scatterplot-zoom';
export const VIZ_LABEL = 'Scatterplot Zoom';

export const VIZ_OPTIONS = {
    background_color: {
        type: 'string',
        label: 'Background Color',
        default: '#000000',
        display: 'color',
        section: 'Style',
        order: 1,
    },
    label_color: {
        type: 'string',
        label: 'Label Color',
        default: '#FFFFFF',
        display: 'color',
        section: 'Style',
        order: 2,
    },
    grid_color: {
        type: 'string',
        label: 'Grid Color',
        default: 'rgba(255, 255, 255, 0.1)',
        display: 'text',
        section: 'Style',
        order: 3,
    },
    point_radius: {
        type: 'number',
        label: 'Point Radius',
        default: 5,
        display: 'text',
        section: 'Style',
        order: 4,
    }
};
