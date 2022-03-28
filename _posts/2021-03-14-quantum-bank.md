---
layout: post
title: Wiesner's Quantum Bank
usemathjax: true
---

We're Wiesner's Quantum Bank, the biggest name in quantum money storage. Check out our new remote service:

```
nc crypto.utctf.live 1234
```

## First Steps

No source provided :( Let's connect through netcat then: 

```
<== Welcome to Wiesner's Quantum Bank! ==>

Due to totally legitimate reasons, we only have one Schroedinger Buck (SB) in the whole bank. Good thing nobody can copy it!

Each member of Wiesner's Quantum Bank also gets a free qubit with which they can do whatever they want. Surely this will not come back to bite us!

What would you like to do today?

    a) Work with a qubit from the Schroedinger Buck
    b) Submit a valid Schroedinger Buck in exchange for a flag (why do we sell flags???)
    c) Quit

Choice [a|b|c]:

```

Alright, they're talking about quantum money, and we can work with qubits. Let's find out what we can do:

```
Which qubit of the Schroedinger Buck would you like to work with? Enter a number between 0-29 (inclusive):
0
What operation would you like to perform?

    a) Apply X gate to my qubit
    b) Apply Y gate to my qubit
    c) Apply Z gate to my qubit
    d) Apply H (Hadamard) gate to my qubit
    e) Apply Rotation gate to my qubit
    f) Apply CNOT gate to my qubit and the SB qubit
    g) Apply CNOT-X gate to my qubit and the SB qubit
    h) Have the SB qubit verified (bank measures)
    i) Measure the SB qubit in the [0,1] basis
    j) Measure the SB qubit in the [+,-] basis
    k) Measure the control qubit (takes you to main menu after)
    l) Go back to the main menu (resets your qubit)

Choice [a|b|c|d|e|f|g|h|i|j|k|l]:
```

Okay, that's a lot of operations. At this point I realized that I could not get through the challenge with zero knowledge of quantum mechanics, so I had to brush up on some reading.

## The Basics

As mentioned before, this challenge is about a quantum money scheme, where each (well, the only) bill is a quantum state made up for 30 qubits. You might be wondering: what are qubits? 

*Disclaimer: this is not a complete or detailed explanation, it's just enough to understand the challenge.*

Qubits are **qu**antum **bits**. A normal bit contains the value 0 or 1, simple as that. But a qubit is a superposition of both states, which are designated $$\vert 0 \rangle$$ and $$\vert 1 \rangle$$.  However, this does not mean that a qubit contains a value between 0 and 1. It simply means that, when measured, the qubit will show 0 or 1 with some probability dependent on its quantum state. 

 $$\vert 0 \rangle$$ and $$\vert 1 \rangle$$ also have vector representations $$\begin{bmatrix}1 \\ 0\end{bmatrix}$$and  $$\begin{bmatrix}0 \\ 1\end{bmatrix}$$ respectively. Linear algebra enthusiasts might note that this means they form an *orthogonal basis* - indeed, $$[0, 1]$$ is called the *computational basis* of qubits. 

A general qubit could then be expressed as $$\alpha\vert 0\rangle + \beta \vert 1\rangle$$, where $$\alpha$$ and $$\beta$$ are real numbers. When measured in the computational basis, this qubit has probability $$\vert \alpha\vert ^2$$ to show $$\vert 0 \rangle$$ and $$\vert \beta\vert ^2$$ to show $$\vert 1 \rangle$$. (Just take my word for this one.) (Quick check: the qubits $$\vert 0 \rangle$$ and $$\vert 1 \rangle$$ indeed have 100% chance to measure as $$\vert 0 \rangle$$ and $$\vert 1 \rangle$$  respectively.)

But you could also measure the qubit in any other orthogonal basis, which would not show $$\vert 0 \rangle$$ and $$\vert 1 \rangle$$ but the vectors in that basis instead. For example, if we define  $$\vert + \rangle = \frac{1}{\sqrt{2}}\vert 0 \rangle + \frac{1}{\sqrt{2}}\vert 1 \rangle$$ and $$\vert - \rangle = \frac{1}{\sqrt{2}}\vert 0 \rangle - \frac{1}{\sqrt{2}}\vert 1 \rangle$$, $$[+, -]$$ form another orthogonal basis, and if we measure any qubit $$\alpha\vert 0\rangle + \beta \vert 1\rangle$$ in this basis we would have different probabilities to show either $$\vert + \rangle$$ or $$\vert - \rangle$$ (which I can't be bothered to write out).

## The Problem

On to the challenge: we wish to forge our own valid Schrodinger Buck by measuring each qubit using the operations given to us. As shown by the title, the challenge is using Wiesner's quantum money scheme. This means that each qubit has 4 possible values: $$\vert 0 \rangle$$, $$\vert 1 \rangle$$, and also two other states denoted as $$\vert + \rangle$$ and $$\vert - \rangle$$. $$\vert + \rangle = \frac{1}{\sqrt{2}}\vert 0 \rangle + \frac{1}{\sqrt{2}}\vert 1 \rangle$$ and $$\vert - \rangle = \frac{1}{\sqrt{2}}\vert 0 \rangle - \frac{1}{\sqrt{2}}\vert 1 \rangle$$. We already know that the $$\vert 0 \rangle$$ and $$\vert 1 \rangle$$ states always measure as 0 and 1, but these new states, $$\vert + \rangle$$ and $$\vert - \rangle$$, both have a $$\frac{1}{2}$$ chance of measuring as either $$\vert 0 \rangle$$ or $$\vert 1 \rangle$$, since $$\vert \alpha\vert ^2 = \vert \beta\vert ^2 =\frac{1}{2}$$.

You may be wondering at this point: why don't we just measure each qubit? After all, the bank gives you the option to measure in both bases!* Well, there are two problems with this.

1. When you measure a qubit, it takes on the value it shows. So if you measure $$\vert + \rangle$$ in the $$[0, 1]$$ basis, it will become either $$\vert 0 \rangle$$ or  $$\vert 1 \rangle$$, and you won't be able to tell what it originally was.
2. Even if you were able to measure each qubit multiple times, there is an even $$\frac{1}{2}$$ chance that it would measure as either $$\vert 0 \rangle$$ or $$\vert 1 \rangle$$, so you *still* wouldn't be able to tell what it was.

*\*Okay, it turns this was possible in the challenge, but it was an unintended bug. And way less cool than the actual solution.*

## The Solution

Doing a bit of research, I came across [a paper](https://arxiv.org/pdf/1404.1507.pdf) that described a few ways to attack this specific quantum money scheme. One of them was named the "bomb-testing" attack, and it caught my notice especially because it used a "probe" qubit, which seemed to line up exactly with the "free qubit" the bank gave us for no apparent reason. I won't go into the full details of the attack, but you can read the paper if you wish to know more. Essentially, the attack works like this:

1. We apply *controlled* not gates (CNOT, CNOT-X) to the free qubit and the SB qubit, which produce different results depending on the state of the SB qubit. A useful fact that enables this to work well is the fact that $$\vert + \rangle$$ and $$\vert - \rangle$$ both stay *invariant* (don't change) under a CNOT gate.
2. One pass will allow us to determine if the SB qubit is $$\vert + \rangle$$ or not. A second pass will allow us to determine if the SB qubit is $$\vert - \rangle$$ or not. If it is neither, then we have eliminated the probabilistic possibilities of the qubit, and we can just straight up measure it in the computational basis $$[0, 1]$$ to get the 100% correct value.

We can repeat this attack 30 times, once for each qubit, to get all 30 qubits and successfully forge our bill. 

Here is the script I wrote for this:

```python
from pwn import *
import math

sh = remote('crypto.utctf.live', 1234)

rounds = 100
sigma = math.pi / (2 * rounds)

sb = ''

for i in range(30):
  print(i)
  sh.recvuntil('Choice [a|b|c]:')
  sh.recvline()
  sh.sendline('a'.encode())
  sh.recvline()
  sh.recvline()
  sh.sendline(str(i).encode())
  #test for +
  print('+ pass')
  for a in range(16):
    sh.recvline()
  for _ in range(rounds):
    sh.sendline('e'.encode())
    #print('end e')
    #print(sh.recvline())
    #print(sh.recvline())
    sh.sendline(str(sigma).encode())
    #print('send sigma')
    for b in range(4):
      sh.recvline()
    sh.sendline('f'.encode())
    for b in range(4):
      sh.recvline()
    sh.sendline('h'.encode())
    for b in range(4):
      sh.recvline()
  sh.sendline('k'.encode())
  sh.recvuntil('\nYour qubit measured as a ')
  mq = int(sh.recvline().decode()[0])
  print('my qubit', mq)
  if mq == 1:
    sb += '+'
    continue

  #test for -
  print('- pass')
  sh.recvuntil('Choice [a|b|c]:')
  sh.recvline()
  sh.sendline('a'.encode())
  sh.recvuntil('(inclusive):')
  sh.recvline()
  sh.sendline(str(i).encode())
  sh.recvuntil('[a|b|c|d|e|f|g|h|i|j|k|l]:')
  sh.recvline()
  for _ in range(rounds):
    sh.sendline('e'.encode())
    #print('end e')
    #print(sh.recvline())
    #print(sh.recvline())
    sh.sendline(str(sigma).encode())
    #print('send sigma')
    for b in range(4):
      sh.recvline()
    sh.sendline('g'.encode())
    for b in range(4):
      sh.recvline()
    sh.sendline('h'.encode())
    for b in range(4):
      sh.recvline()
  sh.recvuntil('[a|b|c|d|e|f|g|h|i|j|k|l]:')
  sh.recvline()
  sh.sendline('k'.encode())
  sh.recvuntil('Your qubit measured as a ')
  mq = int(sh.recvline().decode()[0])
  if mq == 1:
    sb += '-'
    continue

  #0, 1 pass
  print('01 pass')
  sh.recvuntil('Choice [a|b|c]:')
  sh.recvline()
  sh.sendline('a'.encode())
  sh.recvuntil('(inclusive):')
  sh.recvline()
  sh.sendline(str(i).encode())
  sh.recvuntil('[a|b|c|d|e|f|g|h|i|j|k|l]:')
  sh.recvline()
  #measure in [0, 1]
  sh.sendline('i'.encode())
  sh.recvuntil('The SB qubit measured as a ')
  cq = sh.recvline().decode()[0]
  sb += cq

sh.recvuntil('Choice [a|b|c]:')
sh.recvline()
sh.sendline('b'.encode())
sh.recvuntil('long:')
sh.recvline()
sh.sendline(sb.encode())
sh.interactive()
```