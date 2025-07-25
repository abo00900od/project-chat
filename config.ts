export default {
  defaultTemplateId: 'default',
  defaultAltTemplateId: 'defaultAlt',
  templates: {
    'default': '<b>{0}</b>: {1}',
    'defaultAlt': '{0}',
    'print': '<pre>{0}</pre>',
    'example:important': '<h1>^2{0}</h1>',
    'system': '🔧 <b>{0}</b>: {1}',
    'announcement': '📢 <b>{0}</b>: {1}',
    'warning': '⚠️ <b>{0}</b>: {1}',
    'success': '✅ <b>{0}</b>: {1}'
  },
  fadeTimeout: 8000, // Increased for better UX
  suggestionLimit: 6, // Show more suggestions
  style: {
    background: 'linear-gradient(135deg, rgba(44, 62, 80, 0.95) 0%, rgba(52, 73, 94, 0.9) 100%)',
    width: '42vw',
    height: '26%',
  }
};
