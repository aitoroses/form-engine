({
    baseUrl: './',
    name: 'almond',
    include: ['main'],
    out: '../F-lang.js',
    wrap: {
        startFile: 'start.frag',
        endFile: 'end.frag'
    },
    optimize: 'none'
})