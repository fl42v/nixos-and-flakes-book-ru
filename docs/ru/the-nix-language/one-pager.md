Nix - Одностраничник
=================

> **Ахтунг**: тут представлен (вольный) перевод [nix-1p](https://github.com/tazjin/nix-1p). Если с английским порядок, предлагаю не тратить время и топать туда.

Пакетник [Nix](https://nixos.org/nix/) использует одноименный язык. Тут можно по-быстрому узнать основы последнего.

На этой странице под словом "Nix" почти всегда подразумевается именно язык, а не пакетный менеджер.

<!--Please file an issue if something in here confuses you or you think something
important is missing.-->

If you have Nix installed, you can try the examples below by running `nix repl`
and entering code snippets there.

<!-- TODO: нормальный перевод statement и expression -->

# Обзорная экскурсия

Язык Nix является:

*   **Функциональным**. Он не полагается на последовательное исполнение заданных программистом шагов, вместо этого порядок действий определяется *данными*, передаваемыми из предыдущих операций в последующие.


    Все операции в Nix являются выражениями (expression), т.е. любая из них возвращает какие-то данные.

    Выполнение такого выражения возвращает *одну структуру данных*, it does not
    execute a sequence of operations.

    Every Nix file evaluates to a *single expression*.
*   **Ленивым (lazy)**. Nix пойдет считать выражение только в том случае, если его результат где-то используется.

    Скажем, стандартная функция `throw` останавливает выполнение программы и бросает ошибку. Однако в следующее выражение выполнится без проблем, поскольку часть структуры `attrs`, которая бросает ошибку, никому в общем-то не интересна.

    ```nix
    let attrs = { a = 15; b = builtins.throw "Обшибка тут."; };
    in "В 'a' лежит ${toString attrs.a}"
    ```
*   **Специализированным**. Nix существует для того, чтобы решать задачи конкретного пакетника. Не то чтобы на нем вообще нельзя было кодить, просто это не ЯП общего назначения.

# Конструкции языка

## Primitives / literals

Подобно другим языкам, в Nix есть ряд типов данных, которые можно буквально закидывать в код:

```nix
# Числа
42
1.72394

# Строки и пути
"hello"
./some-file.json

# Строки с поддержкой интеропляции
"Hello ${name}"

# Многострочные строки (multiline strings).
# Если у всех одинаковый отступ, на него забивают, т.е.
''
first line
second line
''
# эквивалентно
  ''
    first line
    second line
  ''

# Списки (list-ы) (Никаких запятых!).
[ 1 2 3 ]

# Множества аттрибутов (attribute sets, attrsets)
# Доступ через attrsetName.fieldName
{ a = 15; b = "something else"; }

# Рекурсивные атрсеты (поля могут использовать значения друг друга)
rec { a = 15; b = a * 2; }
```

## Операторы

Большинство операций не отличаются от таковых в других ЯП:

| Синтаксис | Описание |
|----------------------|-----------------------------------------------------------------------------|
| `+`, `-`, `*`, `/`   | Операции с числами |
| `+`                  | Сложение (конкатенация) строк |
| `++`                 | Сложение (конкатенация) списков |
| `>`, `>=`, `<`, `<=`, `==` | Сравнения |
| `&&`                 | Логическое `и` |
| <code>&vert;&vert;</code> | Логическое `или` |
| `e1 -> e2`           | Импликация (<code>!e1 &vert;&vert; e2</code>)                 |
| `!`                  | Отрицание |
| `set.attr`           | Получение значения аттрибута `attr` в аттрсете `set` |
| `set ? attr`         | Проверка на наличие того же аттрибута в аттрсете |
| `left // right`      | Сложить аттрсеты `left` и `right`, with the right set taking precedence |

Make sure to understand the `//`-operator, as it is used quite a lot and is
probably the least familiar one.

## Переменные

Переменные создаются через `let`-экспрешны и имеют ограниченную область видимости. Например,

```nix
let
  a = 15;
  b = 2;
in a * b

# Возвращает 30
```

Переменные не изменяемы, т.е. однажды положив что-либо в `a` или `b`, изменить это что-то уже не получится. Можно, однако, использовать вложенные `let`-ы, тогда новые переменные с тем же именем скроют старые в своей области видимости.

Вне своих `let`-ов переменные недоступны. Глобальных переменных тоже нет.

## Функции

Функции в Nix - лямбды и в общем-то являются типом данных. Если функцию надо как-то назвать, а не использовать на месте, ее кладут в переменную или attrset.

```
# Пример функции (name - аргумент)
name: "Дороу, ${name}!"
```

### Несколько аргументов ([currying][])

Чисто технически, каждая функция принимает только **один аргумент**. Однако если этого не хватает, никто не запрещает создать лямбду, которая возвращает лямбду, которая... Выглядит, кстати, не так страшно:

```nix
name: age: "${name}, ${toString age} годиков."
```

Одна из плюшек такого подхода - можно передать в функцию один из аргументов и оставить полученный полуфабрикат на будущее:

```nix
let
  multiply = a: b: a * b;
  doubleIt = multiply 2; # передали a, ждем только b
in
  doubleIt 15

# получаем 30
```

### Несколько аргументов (attrset)

Можно сделать чуть по-другому и передать attrset:

```nix
{ name, age }: "${name}, ${toString age} годиков"
```

Плюшки при таком подходе отличаются. Например, можно передавать дефолтные значения аргументов:

```nix
{ name, age ? 42 }: "${name} is ${toString age} years old"

```

На деле выглядит как-то так:

```nix
let greeter =  { name, age ? 42 }: "${name}, ${toString age} 42";
in greeter { name = "Slartibartfast"; }

# Получаем "Слартибартфаст, 42 годика"
# (На деле он, конечно, сильно старше)
```

Еще можно воткнуть многоточие (ellipsis), что позволит принимать attrset с большим количеством переменных, чем нужно функции:  

```nix
let greeter = { name, age, ... }: "${name}, ${toString age} годика";
    person = {
      name = "Слартибартфаст";
      age = 42;
      email = "slartibartfast@magrath.ea";
    };
# 'email' в функции 'greeter' не используется и даже не светится в аргументах, однако ничего не падает
in greeter person 
```

Наконец, `@` позволяет привязать (bind) прилетевший в аргументы attrset к какой-нибудь переменной:

```nix
let func = { name, age, ... }@args: builtins.attrNames args;
in func {
    name = "Слартибартфаст";
    age = 42;
    email = "slartibartfast@magrath.ea";
}

# Выдает: [ "age" "email" "name" ]
```

**Ахтунг:** Использование `@` вместе с дефолтными значениями может давать отличный от желаемого результат, поскольку в связанный таким образом attrset прилетают только явно переданные аргументы:

```nix
({ a ? 1, b }@args: args.a) { b = 1; }
# выхлоg: error: attribute 'a' missing

({ a ? 1, b }@args: args.a) { b = 1; a = 2; }
# порядок: 2
```

## `if ... then ... else ...`

В Nix есть ветвление, однако стоит помнить, что при проверке обязательно указать обе ветки (т.к. в любом случае надо что-то вернуть, все дела).

```nix
if someCondition
then "верно"
else "неверно"
```

## `inherit`

`inherit` позволяет аттрсету или `let`-бинду "наследовать" переменные из родительской области видимости. Короче говоря, `inherit foo;` - синтаксический сахар для `foo = foo;`.

Пример:

```nix
let
  name = "Slartibartfast";
  # ... чет-еще
in {
  name = name; # присваиваем значение переменной 'name' аттрсету по ключу 'name'
  # ... чет-еще
}
```

`name = name;` Можно заменить на `inherit name;`:

```nix
let
  name = "Slartibartfast";
  # ...
in {
  inherit name;
  # ...
}
```

Штука достаточно удобная, поскольку так можно стащить несколько переменных сразу, а также переменные из других аттрсетов:

```nix
{
  inherit name age; # `name = name; age = age;`
  inherit (otherAttrs) email; # `email = otherAttrs.email`;
}
```

## `with`-стейтменты

`with` вытаскивает все переменные из аттрсета:

```nix
let attrs = { a = 15; b = 2; };
in with attrs; a + b # 'a' и 'b' теперь переменные до конца области видимости with-а
```

## `import` / `NIX_PATH` / `<entry>`

Файл на Nix может импортировать другой никсофайл, используя одноименную функцию и путь до последнего:

```nix
# предположим, в этой же директории лежит lib.nix с дофига полезными функциями
let myLib = import ./lib.nix;
in myLib.usefulFunction 42
```

`import` прочитает и выполнит файл, вернув полученное при этом значение.

Достаточно часто в файлах лежат функции, тогда их импорт выглядит следующим образом: `import ./some-file { ... }`.

Подобно `PATH` в стандартных дистрибутивах Linux, в Nix существует переменная окружения `NIX_PATH`, где путям до файлов с nix-экспрешнами сопоставляют уникальные читаемые имена.

В случае типичного инстолла там можно найти, например, несколько [каналов][] (скажем, `nixpkgs` или `nixos-unstable`) и путь до конгига.

Информацию из `NIX_PATH` можно получить следующим образом:

```nix
<nixpkgs>
# что-то вроде `/home/tazjin/.nix-defexpr/channels/nixpkgs`
```

Это частенько используется для импорта упомянутых каналов:

```nix
let pkgs = import <nixpkgs> {};
in pkgs.something
```

## `or`

Кейворд `or` используется, чтобы вытащить значение из аттрсета
при его наличии и вернуть дефолтное в противном случае. Выглядит как-то так:

```nix
# 'a' в наличии
let set = { a = 42; };
in set.a or 23
```

Ловим `42`.


```nix
# Ключ 'a' наелся и спит
let set = { };
in set.a or 23
```

Соответственно ловим фолбэчное `23`.

# Стандартные библиотеки

Не совсем ясно, кого из них считать стдлибом, но знать определенно полезно каждую.

## `builtins`

Часть функций уже встроены в язык и работают вне зависимости от того, импортировался ли какой-то другой никсокод. Большинство из них реализованы на уровне интерпретатора и, как следствие, работают куда быстрее аналогов, написанных Nix.

Все встроенные функции [описаны в референсной документации][builtins], там же можно найти примеры их использования.

Достаточно часто встречаются следующие builtin-ы:

* `derivation` (См. [Derivations](#derivations))
* `toJSON` / `fromJSON`
* `toString`
* `toPath` / `fromPath`

Встроенные функции, в отличие от кода на Nix, могут сломать штуку, называемую purity. Это что-то вроде свойства, гарантирующего, что выполнение одного и того же же derivation-а приводит к одинаковому результату. 

Примеры таких функций:

* `fetchGit`, который тащит репу с гита и может использовать прописанные в окружении креденшлы git/ssh
* `fetchTarball`, способный выкачивать и распаковывать архивы без знаний о их хэше (кот в мешке) 

## `pkgs.lib`

Коллекция никсовых пакетов, чаще всего называемая [nixpkgs][],
так же содержит attrset `lib`, в котором можно найти кучу полезных функций.

Издревле (🙃) описание таких функций [лежит в сырцах][lib-src]. Автор оригинального одностраничника, однако, в 2018 написал тулзу [nixdoc][], что генерирует по ним [человеческий мануал][lib-manual]. По заверениям автора, на момент 19го года последний включал не всю сгенерированную документацию, так что в некоторых случаях может понадобиться заняться чтением комментов в исходниках.

Что касается содержания `pkgs.lib`, там лежат всевозможные утилиты для работы с никсовыми типами данных (list-ы, аттрсеты, строки и т.д.), так что знание возможностей либы крайне желательно.

```nix
{ pkgs ? import <nixpkgs> {} }:

with pkgs.lib; # притащить pkgs.lib в область видимости

strings.toUpper "hello"

# возвращает "HELLO"
```

## `pkgs`. Просто `pkgs`

Помимо самих пакетов тут лежат полезные для пакетирования софта утилиты.

Часть из них, к примеру, объединены под названием [trivial builders][] и предоставляют возмжности для создания текстовых файлов/shell-скриптов, запуска скриптов и комманд с получением их вывода и т.д.

```nix
{ pkgs ? import <nixpkgs> {} }:

pkgs.writeText "hello.txt" "Привет лунатикам!"

# возвращает derivation, где создает hello.txt с (нафиг не)нужным содержимым
```

# Derivations

При выполнении никсового выражения на выходе можено получить одну или несколько штук, называемых *derivation*. Этот термин означает какой-то build action, при выполнении которого в `/nix/store/` ложится один или несколько файлов/директорий.

На низком уровне они создаются builtin-ом `derivation`, однако пользователи чаще всего используют что-то более высокоуровневое, вроде [stdenv.mkDerivation][smkd]. А еще [у них есть свой мануал][drv-manual], где можно подробнее прочитать, например, про опакечивание софта.

# Идиомы Nix

Тут можно найти неполный список никсовых идиом. Хотя эти конструкции и не являются частью стандарта языка, они встречаются достаточно часто.

## Файлы с лямбдами

Правилом хорошего тона считается класть в файл функцию, которая принимает на вход необходимые зависимости вместо того, чтобы импортировать их напрямую. Такой подход позволяет поьзователю без проблем поменять, например, используемую версию `nixpkgs`.

Обычно это выглядит примерно следующим образом:


```nix
{ pkgs ? import <nixpkgs> {} }:

# ... теперь 'pkgs' можно юзать в коде
```

## `callPackage`

Building on the previous pattern, there is a custom in nixpkgs of specifying the
dependencies of your file explicitly instead of accepting the entire package
set.

For example, a file containing build instructions for a tool that needs the
standard build environment and `libsvg` might start like this:

```nix
# my-funky-program.nix
{ stdenv, libsvg }:

stdenv.mkDerivation { ... }
```

Any time a file follows this header pattern it is probably meant to be imported
using a special function called `callPackage` which is part of the top-level
package set (as well as certain subsets, such as `haskellPackages`).

```nix
{ pkgs ? import <nixpkgs> {} }:

let my-funky-program = pkgs.callPackage ./my-funky-program.nix {};
in # ... something happens with my-funky-program
```

The `callPackage` function looks at the expected arguments (via
`builtins.functionArgs`) and passes the appropriate keys from the set in which
it is defined as the values for each corresponding argument.

## Overrides / Overlays

One of the most powerful features of Nix is that the representation of all build
instructions as data means that they can easily be *overridden* to get a
different result.

For example, assuming there is a package `someProgram` which is built without
our favourite configuration flag (`--mimic-threaten-tag`) we might override it
like this:

```nix
someProgram.overrideAttrs(old: {
    configureFlags = old.configureFlags or [] ++ ["--mimic-threaten-tag"];
})
```

This pattern has a variety of applications of varying complexity. The top-level
package set itself can have an `overlays` argument passed to it which may add
new packages to the imported set.

Note the use of the `or` operator to default to an empty list if the
original flags do not include `configureFlags`. This is required in
case a package does not set any flags by itself.

Since this can change in a package over time, it is useful to guard
against it using `or`.

For a slightly more advanced example, assume that we want to import `<nixpkgs>`
but have the modification above be reflected in the imported package set:

```nix
let
  overlay = (final: prev: {
    someProgram = prev.someProgram.overrideAttrs(old: {
      configureFlags = old.configureFlags or [] ++ ["--mimic-threaten-tag"];
    });
  });
in import <nixpkgs> { overlays = [ overlay ]; }
```

The overlay function receives two arguments, `final` and `prev`. `final` is
the [fixed point][fp] of the overlay's evaluation, i.e. the package set
*including* the new packages and `prev` is the "original" package set.

See the Nix manual sections [on overrides][] and [on overlays][] for more
details (note: the convention has moved away from using `self` in favor of
`final`, and `prev` instead of `super`, but the documentation has not been
updated to reflect this).

[currying]: https://en.wikipedia.org/wiki/Currying
[builtins]: https://nixos.org/nix/manual/#ssec-builtins
[nixpkgs]: https://github.com/NixOS/nixpkgs
[lib-src]: https://github.com/NixOS/nixpkgs/tree/master/lib
[nixdoc]: https://github.com/tazjin/nixdoc
[lib-manual]: https://nixos.org/nixpkgs/manual/#sec-functions-library
[channels]: https://nixos.org/nix/manual/#sec-channels
[trivial builders]: https://github.com/NixOS/nixpkgs/blob/master/pkgs/build-support/trivial-builders.nix
[smkd]: https://nixos.org/nixpkgs/manual/#chap-stdenv
[drv-manual]: https://nixos.org/nix/manual/#ssec-derivation
[fp]: https://github.com/NixOS/nixpkgs/blob/master/lib/fixed-points.nix
[on overrides]: https://nixos.org/nixpkgs/manual/#sec-overrides
[on overlays]: https://nixos.org/nixpkgs/manual/#chap-overlays
