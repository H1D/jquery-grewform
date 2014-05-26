module.exports = function (grunt) {
    var buildBanner = '/*\n\
* jQuery GrewForm Plugin v<%= pkg.version %>\n\
*\n\
* Copyright 2011-<%= grunt.template.today("yyyy") %>, Artem Suschev\n\
* Grandcapital Ltd.\n\
* Contributions: Andre_487 (https://github.com/Andre-487/)\n\
*\n\
* Licensed under the MIT license (license.txt)\n\
*/';
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: buildBanner,
                sourceMap: true,
                compress: {
                    drop_console: true
                }
            },
            build: {
                src: 'jquery.grewform.js',
                dest: 'jquery.grewform.min.js',
                'source-map': 'jquery.grewform.min.map'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('copy_compiled', function () {
        var baseName = 'jquery.grewform.min.js',
            srcFile = __dirname + '/' + baseName,
            testFile = __dirname + '/tests/' + baseName;
        grunt.file.copy(srcFile, testFile);
    });
    grunt.registerTask('minify', ['uglify', 'copy_compiled'])
};
