---
layout: post
title: Quantum Engine
usemathjax: true
---

Let's take a look at the source code:

```python
import socketserver
from secrets import flag
import signal
from qiskit import *
import itertools

class CircuitException(Exception):
    pass


class Circuit:

    def __init__(self, inputGates) -> None:
        self.a = 0
        self.b = 0
        self.c = 0
        self.inputGates = inputGates
    
    def append_HGate(self, qbit):
        qbit = int(qbit)
        if qbit in range(4):
            self.circuit.h(qbit)
        else:
            raise CircuitException('Non-valid qbit position given...')
    
    def append_TGate(self, qbit):
        qbit = int(qbit)
        if qbit in range(4):
            self.circuit.t(qbit)
        else:
            raise CircuitException('Non-valid qbit position given...')

    def append_TdgGate(self, qbit):
        qbit = int(qbit)
        if qbit in range(4):
            self.circuit.tdg(qbit)
        else:
            raise CircuitException('Non-valid qbit position given...')

    def append_CZGate(self, qbits):
        qbits = qbits.split(',')
        c_qubit = int(qbits[0])
        t_qubit = int(qbits[1])

        if c_qubit in range(4) and t_qubit in range(4):
            self.circuit.cz(c_qubit, t_qubit)
        else:
            raise CircuitException('Non-valid qbit position given...')


    def generate_Circuit(self):

        self.circuit = QuantumCircuit(4,3)

        if self.a == 1:
            self.circuit.x(0)
        if self.b == 1:
            self.circuit.x(1)
        if self.c == 1:
            self.circuit.x(2)
        
        for gate in self.inputGates:
            gate = gate.split(':')
            if gate[0] == 'H':
                self.append_HGate(gate[1])
            elif gate[0] == 'T':
                self.append_TGate(gate[1])
            elif gate[0] == 'TDG':
                self.append_TdgGate(gate[1])
            elif gate[0] == 'CZ':
                self.append_CZGate(gate[1])
            else:
                raise CircuitException('Non-valid gate given...')

        self.circuit.measure([0,2,3],[0,1,2])
        if self.circuit.depth() > 43:
            raise CircuitException('Circuit is too big...')
        
    def check_Circuit(self):
        inputs = list(itertools.product([0, 1], repeat=3))

        for input in inputs:
            self.a = input[0]
            self.b = input[1]
            self.c = input[2]

            self.generate_Circuit()

            simulator = Aer.get_backend('qasm_simulator')
            counts = execute(self.circuit,backend=simulator, shots = 1).result().get_counts()
            counts = next(iter(counts))[::-1]
            if (int(counts[0]) == self.a) and int(counts[1]) == self.c ^self.a ^ self.b and (int(counts[2]) == self.a&self.b|self.b&self.c|self.c&self.a):
                pass
            else:
                return False
        return True

        

def challenge(req):
    try:
        req.sendall(b'\lvert--------------------------------\lvert\n'+
                    b'\lvert Phalcon\'s Accelaration System \lvert\n'+
                    b'\lvert--------------------------------\lvert\n'+
                    b'\lvert > Send quantum circuit for the \lvert\n'+
                    b'\lvert system to analyze...           \lvert\n'+
                    b'\lvert--------------------------------\lvert\n'+
                    b'\n> '
                    )
        input = req.recv(4096).decode().strip().split(';')

        if len(input) < 0 or len(input) > 100:
            raise CircuitException('Non-valid circuit length...')
        
        quantumCircuit = Circuit(input)
        
        if quantumCircuit.check_Circuit():
            req.sendall(flag.encode()+b"\n")
            req.close()
            exit()
        else:
            req.sendall(b'The circuit failed to pass the test...\n')
            req.close()
            exit()


    except CircuitException as ce:
        try:
            req.sendall(ce.encode()+b'\n')
            req.close()
        except:
            pass
        exit()

    except Exception as e:
        try:
            req.sendall(b'Unexpected error.\n')
            req.close()
        except:
            pass
        exit()

class incoming(socketserver.BaseRequestHandler):
    def handle(self):
        signal.alarm(300)
        req = self.request
        print("starting server")
        while True:
            challenge(req)

class ReusableTCPServer(socketserver.ForkingMixIn, socketserver.TCPServer):
    pass

socketserver.TCPServer.allow_reuse_address = False
server = ReusableTCPServer(("0.0.0.0", 1337), incoming)
server.serve_forever()
```

Alright, so the main part of the challenge is in the `Circuit` class. It looks like we're implementing a quantum circuit that satisfies this:

```python
def check_Circuit(self):
        inputs = list(itertools.product([0, 1], repeat=3))

        for input in inputs:
            self.a = input[0]
            self.b = input[1]
            self.c = input[2]

            self.generate_Circuit()

            simulator = Aer.get_backend('qasm_simulator')
            counts = execute(self.circuit,backend=simulator, shots = 1).result().get_counts()
            counts = next(iter(counts))[::-1]
            if (int(counts[0]) == self.a) and int(counts[1]) == self.c ^self.a ^ self.b and (int(counts[2]) == self.a&self.b|self.b&self.c|self.c&self.a):
                pass
            else:
                return False
        return True
```

So given 3 inputs $$a, b, c$$ and 4 total qubits to work with, we need to set the outputs to be $$a$$, $$a \oplus b \oplus c$$, and $$(a\&b)\lvert(b\&c)\lvert(c\&a)$$. And it looks like the only gates that we are able to use are $$H, T, TDG$$, and $$CZ$$.

## Initial Thoughts

Note the line `self.circuit.measure([0,2,3],[0,1,2])` in the `generate_Circuit` function. This means that the outputs need to be on qubits $$0, 2, $$ and $$3$$ (and the inputs are on qubits $$0, 1, $$ and $$2$$ as shown in the beginning of the function). 

The first output is simple by itself - just don't do anything to the input! This is actually a bit tricky once we implement the others, as you soon will see.

The second output needs to be the XOR of all the inputs. It turns out this isn't too hard either - a $$CNOT$$ (or $$CX$$) gate effectively performs XOR. (Remember that a $$CNOT$$ gate flips the second qubit (across the $$x$$ axis, hence the name $$CX$$) iff the first qubit is $$\lvert1\rangle$$.) That is, for classical bits, $$\text{CNOT}(a, b)$$ takes $$(a, b)$$ to $$(a, a \oplus b)$$. There's just one small problem - we aren't allowed $$CNOT$$ gates! But we are allowed $$CZ$$ gates, which flips the second qubit across the $$z$$ axis iff the first qubit is $$\lvert1\rangle$$. These two operations only differ by an axis, and it turns out that $$HZH = X$$ (and $$HXH = Z$$), so we can implement $$CNOT$$ gates in this way. Remembering that this output needs to be on qubit 2, we can simply apply $$CNOT$$s with control qubits 0 and 1 targeting qubit 2, which would take $$(a, b, c)$$ to $$(a, b, a \oplus b \oplus c)$$ as desired.

```python
qc = QuantumCircuit(4, 3)
qc.h(2)
qc.cz(0, 2)
qc.cz(1, 2)
qc.h(2)
qc.draw()
"""
q_0: ──────■─────────
           │         
q_1: ──────┼──■──────
     ┌───┐ │  │ ┌───┐
q_2: ┤ H ├─■──■─┤ H ├
     └───┘      └───┘
q_3: ────────────────
                     
c: 3/════════════════   
"""
```

The third output is a bit trickier. $$(a\&b)\lvert(b\&c)\lvert(c\&a)$$ is a complicated expression. While it is possible to construct circuits that simulate AND and OR, the main problem is that to be able to use the value of each input twice, we would need multiple ancillary qubits so that the value of the inputs aren't lost. Instead, it helps to think of the expression as a whole rather than the individual parts. What it's really saying is "set the output bit to $$\lvert1\rangle$$ if at least 2 of the input bits are $$\lvert1\rangle$$". Or, if you think about it, "set the output bit to the majority of the input bits". What does this sound like? To me, error correction comes to mind. 

The basic single-qubit bit flip error correction circuit looks like this:

```
                ░           ┌───┐
q_0: ──■────■───░───■────■──┤ X ├
     ┌─┴─┐  │   ░ ┌─┴─┐  │  └─┬─┘
q_1: ┤ X ├──┼───░─┤ X ├──┼────■──
     └───┘┌─┴─┐ ░ └───┘┌─┴─┐  │  
q_2: ─────┤ X ├─░──────┤ X ├──■──
          └───┘ ░      └───┘     
```

where $$q_0$$ is the qubit to be transmitted, and $$q_1$$ and $$q_2$$ are ancilla qubits which start in state $$\lvert0 \rangle$$. The first 2 $$CNOT$$ gates essentially serve to copy the value of $$q_0$$ into $$q_1$$ and $$q_2$$, and then $$q_0$$ is potentially flipped. After a few more gates, no matter the starting value of $$q_0$$ and no matter if it is flipped or not, in the end $$q_0$$ will have the same value it started with. The last gate is a $$CCNOT$$ gate, a double-controlled not gate, also known as a Toffoli gate, which flips the target ($$q_0$$) iff both inputs ($$q_1$$ and $$q_2$$) are $$\lvert1 \rangle$$. It basically acts like an AND gate. 

Now it turns out if you disregard the first half of the circuit (copying $$q_0$$ into $$q_1$$ and $$q_2$$), this circuit does exactly what we want it to. Try it yourself for some random inputs if you're not convinced - it will set $$q_0$$ to the majority bit. Now how do we implement this? I've already shown how to implement $$CNOT$$ gates above, and for the $$CCNOT$$ gate, you could either look it up, or use qiskit's `decompose` function to decompose it into gates we know how to make.

```python
qc = QuantumCircuit(3)
qc.ccx(0, 1, 2)
qc.decompose().draw()
"""
                                                       ┌───┐      
q_0: ───────────────────■─────────────────────■────■───┤ T ├───■──
                        │             ┌───┐   │  ┌─┴─┐┌┴───┴┐┌─┴─┐
q_1: ───────■───────────┼─────────■───┤ T ├───┼──┤ X ├┤ TDG ├┤ X ├
     ┌───┐┌─┴─┐┌─────┐┌─┴─┐┌───┐┌─┴─┐┌┴───┴┐┌─┴─┐├───┤└┬───┬┘└───┘
q_2: ┤ H ├┤ X ├┤ TDG ├┤ X ├┤ T ├┤ X ├┤ TDG ├┤ X ├┤ T ├─┤ H ├──────
     └───┘└───┘└─────┘└───┘└───┘└───┘└─────┘└───┘└───┘ └───┘      
"""
```

## Putting it All Together

There are a few final issues to take care of. We have successfully calculated each output bit individually, but how to put it all together? First, note that our adapted error correction circuit has the potential to flip $$q_1$$ and $$q_2$$, so we need to track the original value of $$q_0$$ to see whether or not we need to re-flip $$q_1$$ and $$q_2$$ after performing the "error correction". This is easy enough - since our extra 4th qubit $$q_3$$ is guaranteed to start at zero, performing a $$CNOT$$ to XOR the value of one of the qubits into the 4th qubit would copy it into the 4th qubit. We can actually then just run our adapted error correction circuit targeting this 4th qubit, since we want this output on $$q_3$$ in the end anyway. After that, since we have the original value of the qubit, we can reflip the other qubits if needed, and then use all 3 original inputs to calculate the other outputs, which is not hard. The final circuit looks like this:

```python
from qiskit import *
from qiskit.extensions import *

qc = QuantumCircuit(4, 3)

#copy qubit 3 to qubit 2
qc.h(3)
qc.cz(2, 3)
qc.h(3)

#"error correct" (output 3): convert qubit 3 to majority of (0, 1, 3), using two CX and one CCX 
qc.h(0)
qc.cz(3, 0)
qc.h(0)
qc.h(1)
qc.cz(3, 1)
qc.h(1)

#CCX decomposed
qc.cz(1, 3)
qc.h(3)
qc.tdg(3)
qc.h(3)
qc.cz(0, 3)
qc.h(3)
qc.t(3)
qc.h(3)
qc.cz(1, 3)
qc.h(3)
qc.tdg(3)
qc.h(3)
qc.cz(0, 3)
qc.h(3)
qc.t(3)
qc.h(3)
qc.t(1)
qc.h(1)
qc.cz(0, 1)
qc.h(1)
qc.tdg(1)
qc.t(0)
qc.h(1)
qc.cz(0, 1)
qc.h(1)

#reflip 0 and 1 if necessary
qc.h(0)
qc.cz(2, 0)
qc.h(0)
qc.h(1)
qc.cz(2, 1)
qc.h(1)

#xor (output 2)
qc.h(2)
qc.cz(0, 2)
qc.cz(1, 2)
qc.h(2)

qc.measure([0,2,3],[0,1,2])

qc.draw()
"""
     ┌───┐           ┌───┐                    »
q_0: ┤ H ├─────────■─┤ H ├────────────────────»
     ├───┤         │ └───┘┌───┐               »
q_1: ┤ H ├─────────┼───■──┤ H ├─■─────────────»
     └───┘         │   │  └───┘ │             »
q_2: ──────■───────┼───┼────────┼─────────────»
     ┌───┐ │ ┌───┐ │   │        │ ┌───┐┌─────┐»
q_3: ┤ H ├─■─┤ H ├─■───■────────■─┤ H ├┤ TDG ├»
     └───┘   └───┘                └───┘└─────┘»
c: 3/═════════════════════════════════════════»
                                              »
«                                                »
«q_0: ──────■────────────────────────────────────»
«           │                   ┌───┐ ┌───┐      »
«q_1: ──────┼─────────────────■─┤ T ├─┤ H ├──────»
«           │                 │ └───┘ └───┘      »
«q_2: ──────┼─────────────────┼──────────────────»
«     ┌───┐ │ ┌───┐┌───┐┌───┐ │ ┌───┐┌─────┐┌───┐»
«q_3: ┤ H ├─■─┤ H ├┤ T ├┤ H ├─■─┤ H ├┤ TDG ├┤ H ├»
«     └───┘   └───┘└───┘└───┘   └───┘└─────┘└───┘»
«c: 3/═══════════════════════════════════════════»
«                                                »
«             ┌───┐               ┌───┐   ┌───┐»
«q_0: ─■───■──┤ T ├─────────────■─┤ H ├─■─┤ H ├»
«      │   │  ├───┤┌─────┐┌───┐ │ ├───┤ │ ├───┤»
«q_1: ─┼───■──┤ H ├┤ TDG ├┤ H ├─■─┤ H ├─┼─┤ H ├»
«      │      └───┘└─────┘└───┘   └───┘ │ └───┘»
«q_2: ─┼────────────────────────────────■──────»
«      │ ┌───┐┌───┐ ┌───┐  ┌─┐                 »
«q_3: ─■─┤ H ├┤ T ├─┤ H ├──┤M├─────────────────»
«        └───┘└───┘ └───┘  └╥┘                 »
«c: 3/══════════════════════╩══════════════════»
«                           2                  »
«                   ┌─┐        
«q_0: ─────────■────┤M├────────
«        ┌───┐ │    └╥┘        
«q_1: ─■─┤ H ├─┼──■──╫─────────
«      │ ├───┤ │  │  ║ ┌───┐┌─┐
«q_2: ─■─┤ H ├─■──■──╫─┤ H ├┤M├
«        └───┘       ║ └───┘└╥┘
«q_3: ───────────────╫───────╫─
«                    ║       ║ 
«c: 3/═══════════════╩═══════╩═
«                    0       1 
"""
```

Converting this to the input format given in the source code and submitting it to the server gives us the flag.

