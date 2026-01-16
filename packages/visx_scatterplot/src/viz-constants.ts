
// Visualization Constants
export const VIZ_ID = 'hello_world_tsx';
export const VIZ_LABEL = 'Hello World (TSX)';
export const DEFAULT_TITLE = 'Hello Looker!';

export const VIZ_OPTIONS = {
    title_text: {
      type: 'string',
      label: 'Title Text',
      default: DEFAULT_TITLE,
      display: 'text',
      section: 'Config',
      order: 1,
    },
    background_color: {
        type: 'string',
        label: 'Background Color',
        default: 'transparent',
        display: 'color',
        section: 'Style',
        order: 2,
    }
};
