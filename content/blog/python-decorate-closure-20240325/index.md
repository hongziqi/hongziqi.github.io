---
title: Python-闭包和装饰器
summary: 阐述Python中闭包和装饰器的概念和用法
date: 2024-03-25
draft: false
featured: false
highlight: true
categories:
  - Programming Languages
  
tags:
  - Python

toc: true
comments: true
---
## 闭包
在了解闭包之前，我们先了解一下Python中的作用域规则。

### 变量作用域规则
当在函数内部引用一个变量时，Python解释器会按照`LEGB`规则依次查找该变量：
  - L: Local，局部作用域，即函数内部
  - E: Enclosing，嵌套函数的作用域
  - G: Global，全局作用域
  - B: Built-in，内置模块的作用域

注意: 在Python中，函数内部的全局变量是不可变的，如果需要在函数内部修改全局变量，需要使用`global`关键字 
(也就是说，在函数内部初始化的变量，会被编译成局部变量)。
```python
>>> b = 6
>>> def f1(a):
...    global b
...    print(a)
...    print(b)
...    b = 9
>>> f1(3)
3
6
>>> b
9
```
### 闭包的概念
闭包，指延伸了作用域的函数，可以访问函数定义体之外定义的非全局变量(即Enclosing层)。

特点：
* 闭包必须是一个嵌套函数
* 嵌套函数必须引用外部函数的非全局变量
* 外部函数返回嵌套函数

```python
# 嵌套函数但不是闭包函数
def nested_func():
    x = 10
    def inner_func():
        # 没有引用外部函数的非全局变量
        print("inner_func")
    # 没有返回嵌套函数
    inner_func()

# 闭包函数
def closure_func():
    x = 10
    def inner_func(y):
        return x + y
    return inner_func
```

### nonlocal关键字
在Python3中，引入了`nonlocal`关键字，用于在函数内部修改外部函数的局部变量。例如：
```python
def closure_func_one():
    x[0] = 10
    def inner_func():
        x[0] += 1
        return x
    return inner_func

def closure_func_two():
    x = 10
    def inner_func():
        nonlocal x
        x += 1
        return x
    return inner_func
```
对比`closure_func_one`和`closure_func_two`，`closure_func_one`中的`x`是一个列表(可变类型)，可以在内部函数中修改。
而对于一些不可变类型，如整型、字符串等，在内部函数中，只能读取，修改会隐式创建局部变量，所以不会保存在闭包中。

`closure_func_two`中，使用`nonlocal`关键字，指将x标记为自由变量，即使在函数中修改x，闭包中保存的绑定也会更新。

那么，为什么要使用闭包呢？
* 避免随意使用全局变量，提高代码的可维护性
* 提供了一种封装机制，可以隐藏函数内部定义一些私有变量，外部无法直接访问，只能通过函数内部的方法来访问和修改
* 提供更加灵活的函数调用方式

## 装饰器
装饰器是Python中的一种高级函数，可以用来修改或扩展函数或方法的行为。它本质上是一个函数，接受一个函数作为参数，将它返回或者将其替换为另一个函数或可调用对象。装饰器可以在不修改原函数代码的情况下，为函数添加新的功能或行为。

下面是一个简单的装饰器示例：
```python
def my_decorator(func):
    def inner_func():
        print("Before calling the function")
        func()
        print("After calling the function")
    return inner_func

# 使用装饰器
@my_decorator
def my_function():
    print("This is my function")
```

### 装饰器和闭包
装饰器，可理解为一种特殊的闭包，接受一个函数作为参数，返回一个函数，用于修改或扩展函数的行为。而普通的闭包只是一个嵌套函数，用于延伸作用域。

`@my_decorator` 装饰器将函数 `my_function` 传递给函数 `my_decorator`，函数 `my_decorator` 执行完毕后返回被包装后的 `my_function` 函数，而这个过程其实就是通过闭包实现的。

如果不使用装饰器，我们需要显式调用 `my_decorator(my_function)` 来实现相同的效果。严格来说，装饰器是一种语法糖，使得代码更加简洁易读。

### 装饰器的执行顺序
装饰器在定义时就会执行，而不是在调用时执行。当Python解释器执行到装饰器时，会立即执行装饰器函数，并将被装饰的函数作为参数传递给装饰器函数。

示例：
```python
registry = []
def register(func):
    print(f"Registering {func}")
    registry.append(func)
    return func

@register
def f1():
    print("Running f1()")

@register
def f2():
    print("Running f2()")
    
def main():
    print("Running main()")
    print("Registry:", registry)
    f1()
    f2()

if __name__ == "__main__":
    main()
```
输出为：
```python
Registering <function f1 at 0x7f8b3b7b7d30>
Registering <function f2 at 0x7f8b3b7b7e50>
Running main()
Registry: [<function f1 at 0x7f8b3b7b7d30>, <function f2 at 0x7f8b3b7b7e50>]
Running f1()
Running f2()
```

### 装饰器叠放
装饰器可以叠放，即一个函数可以被多个装饰器修饰，装饰器的执行顺序是从下往上执行，即从内到外执行。
```python
@decorator1
@decorator2
def func():
    pass
```
相当于：
```python
def func():
    pass
func = decorator1(decorator2(func))
```

### 参数化装饰器
装饰器也可以接受参数，这样可以根据参数的不同，为函数添加不同的功能。

示例：
```python
def register(active=True):
      def wrapper(func):
          if active:
              print(f"Registering {func}")
          else:
              print(f"Not registering {func}")
              
          return func
      return wrapper

@register()
def f1():
    print("Running f1()")
    
@register(active=False)
def f2():
    print("Running f2()")

def main():
    f1()
    f2()
    
if __name__ == "__main__":
    main()
```
输出为：
```python
Registering <function f1 at 0x0000021C9A1EEC00>
Not registering <function f2 at 0x0000021C9A1EDA80>
Running f1()
Running f2()
```

### 标准库中的装饰器

#### 内置装饰器
Python标准库中提供了一些内置的装饰器，如`@staticmethod`、`@classmethod`、`@property`等，用于修饰类的方法。

`@staticmethod`：将类的方法转换为静态方法，不需要self参数，不需要实例化，直接类名.方法名()调用。

`@classmethod`：将类的方法转换为类方法，不需要self参数，但第一个参数需要表示自身类的cls参数，不需要实例化，可以类名调用，也可以对象调用，因为持有cls参数，可以调用类的属性，类的方法，实例化对象等，避免硬编码。

`@property`：将类的方法转换为属性，并且只有一个self参数，可以通过属性的方式访问，而不是通过方法调用。

#### functools模块
另外，`functools`模块中也有一些常用的装饰器，如`@wraps`、`@lru_cache`等。

##### @wraps
用于保留原函数的元信息，如函数名、文档字符串、参数列表等，避免装饰器修改原函数的元信息。
可以通过下面的示例来理解：
```python
from functools import wraps

def a_decorator(func):
    def wrapper(*args, **kwargs):
        """A wrapper function"""
        # Extend some capabilities of func
        func()
    return wrapper
 
@a_decorator
def first_function():
    """This is docstring for first function"""
    print("first function")
 
print(first_function.__name__) # wrapper
print(first_function.__doc__) # A wrapper function

def b_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        """A wrapper function"""
        # Extend some capabilities of func
        func()
    return wrapper

@b_decorator
def second_function():
    """This is docstring for second function"""
    print("second function")

print(second_function.__name__) # second_function
print(second_function.__doc__) # This is docstring for second function
```

##### @cache
用于缓存函数的返回值，避免重复计算，提高函数的执行效率。
没有使用缓存的递归斐波那契数列函数：
```python
import time
def clock(func):
    def clocked(*args, **kwargs):
        t0 = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - t0
        name = func.__name__
        arg_str = ', '.join(repr(arg) for arg in args)
        print(f'[{elapsed:.8f}s] {name}({arg_str}) -> {result}')
        return result
    return clocked

@clock
def fibonacci(n):
    if n < 2:
        return n
    time.sleep(1)
    return fibonacci(n-2) + fibonacci(n-1)

if __name__ == '__main__':
    print(fibonacci(4))
```
输出为：
```python
[0.00000000s] fibonacci(0) -> 0
[0.00000000s] fibonacci(1) -> 1
[1.00106740s] fibonacci(2) -> 1
[0.00000000s] fibonacci(1) -> 1
[0.00000000s] fibonacci(0) -> 0
[0.00000000s] fibonacci(1) -> 1
[1.00131822s] fibonacci(2) -> 1
[2.00183153s] fibonacci(3) -> 2
[4.00414205s] fibonacci(4) -> 3
3
```
使用缓存的递归斐波那契数列函数：
```python
from functools import cache

@cache
@clock
def fibonacci(n):
    if n < 2:
        return n
    time.sleep(1)
    return fibonacci(n-2) + fibonacci(n-1)
    
if __name__ == '__main__':
    print(fibonacci(4))
```
输出为：
```python
[0.00000000s] fibonacci(0) -> 0
[0.00000000s] fibonacci(1) -> 1
[1.00009847s] fibonacci(2) -> 1
[1.00089359s] fibonacci(3) -> 2
[3.00199485s] fibonacci(4) -> 3
3
```
可以明显看到，使用缓存后，不会重复计算已经计算过的值，提高了函数的执行效率。

##### @lru_cache
若缓存较大，`@cache`可能会耗尽内存，这个时候可以设置`@lru_cache`中的参数`maxsize`(缓存条目)和`typed`(是否将不同参数类型分开保存)灵活缓存数据。

用法如下：
```python
from functools import lru_cache

@lru_cache(maxsize=128, typed=True)
def fibonacci(n):
    if n < 2:
        return n
    time.sleep(1)
    return fibonacci(n-2) + fibonacci(n-1)
```

##### @singledispatch
用于实现函数的重载，根据不同的参数类型调用不同的函数。
```python
from functools import singledispatch

@singledispatch
def fun(arg):
    print("I don't know what to do with this:", arg)
    
@fun.register(int)
def _(arg):
    print("Received an integer:", arg)
    
@fun.register(str)
def _(arg):
    print("Received a string:", arg)

fun(1) # Received an integer: 1
fun("hello") # Received a string: hello
fun(3.14) # I don't know what to do with this: 3.14
```

## 总结
闭包和装饰器是Python中非常重要的概念，可以帮助我们更好地理解Python的函数式编程特性。




