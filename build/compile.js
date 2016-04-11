import gulp from 'gulp';

import del from 'del';
import flowBin from 'flow-bin';
import {exec} from 'child_process';

const srcFiles = 'src/**/*.{js, es6}';
const outputDir = 'lib';

gulp.task('build', 'Do a full build of the application sources.', ['clean', 'check', 'compile']);

gulp.task('clean', 'Clean the output directory.', function() { del.sync(outputDir); });
gulp.task('check', 'Run a set of validations on the project', ['lint', 'flow']);

gulp.task('flow', 'Verify flow type annotations in project sources.', done => {
  exec(`${flowBin} status --color=always .`, (err, stdout) => {
    console.log(stdout);
    if(err) {
      return done(new gulp.plugins.util.PluginError('flow', 'Flow check error.'));
    } else {
      return done();
    }
  });
});

gulp.task('lint', 'Run the linter on the project sources.', function() {
  return gulp.src(srcFiles)
    .pipe(gulp.plugins.eslint())
    .pipe(gulp.plugins.eslint.format())
    .pipe(gulp.plugins.eslint.failAfterError());
});

gulp.task('compile', 'Compile the sources for the project.', ['flow'], function() {
  return gulp.src(srcFiles)
    .pipe(gulp.plugins.sourcemaps.init())
    .pipe(gulp.plugins.babel())
    .pipe(gulp.plugins.sourcemaps.write())
    .pipe(gulp.dest(outputDir));
});
