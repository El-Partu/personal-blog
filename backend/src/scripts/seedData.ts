/**
 * Sample content so the site is never empty on first run (Section 7).
 * These posts deliberately exercise code blocks, KaTeX math, tables and
 * series navigation.
 */

export interface SeedPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  coverImage?: string;
  seriesSlug?: string;
  seriesOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  daysAgo: number;
  viewCount: number;
}

export const seedSeries = [
  {
    title: "Data Structures & Algorithms",
    slug: "dsa",
    description:
      "Working through the classic data structures and algorithms from first principles — with proofs of correctness, complexity analysis, and implementations I actually typed out myself.",
  },
  {
    title: "Operating Systems Notes",
    slug: "operating-systems",
    description:
      "My notes from studying operating systems: processes, scheduling, memory, concurrency, and the parts of the kernel that finally made everything click.",
  },
];

export const seedPosts: SeedPost[] = [
  {
    title: "Big-O Notation, Explained Without the Hand-Waving",
    slug: "big-o-notation-explained",
    excerpt:
      "Most explanations of Big-O jump straight to 'drop the constants'. Here is the actual definition, why it looks like that, and how to use it without second-guessing yourself.",
    category: "Algorithms",
    tags: ["Complexity", "Algorithms", "Math"],
    seriesSlug: "dsa",
    seriesOrder: 1,
    daysAgo: 42,
    viewCount: 1284,
    seoTitle: "Big-O Notation Explained Properly (With the Formal Definition)",
    seoDescription:
      "A precise but readable introduction to Big-O, Big-Omega and Big-Theta, including the formal definition, worked proofs, and the common mistakes students make.",
    content: `Every algorithms course opens with Big-O, and almost every one of them
skips the definition and goes straight to a table of "common complexities".
That table is useful, but it is not an explanation — and the first time you
meet an unusual recurrence you will be stuck.

So let us start where the textbooks start.

## The formal definition

We say $f(n) = O(g(n))$ if there exist positive constants $c$ and $n_0$ such that:

$$
0 \\le f(n) \\le c \\cdot g(n) \\quad \\text{for all } n \\ge n_0
$$

Read that carefully. It says: *beyond some point $n_0$, the function $f$ never
grows more than a constant multiple of $g$.* That is the whole idea. Big-O is
an upper bound on growth rate, and it only cares about eventual behaviour.

Two consequences fall straight out of this:

1. **Constants vanish.** If $f(n) = 5n$, pick $c = 5$ and $g(n) = n$. Done.
2. **Lower-order terms vanish.** If $f(n) = 3n^2 + 100n + 7$, the $n^2$ term
   eventually dominates everything else.

### Proving a bound properly

Let us show $3n^2 + 100n + 7 = O(n^2)$ rather than just asserting it.

For all $n \\ge 1$ we have $100n \\le 100n^2$ and $7 \\le 7n^2$. Therefore:

$$
3n^2 + 100n + 7 \\le 3n^2 + 100n^2 + 7n^2 = 110n^2
$$

So with $c = 110$ and $n_0 = 1$ the definition is satisfied. That is a complete
proof, and it is the pattern you repeat for almost every polynomial bound.

## O, Ω and Θ

Big-O is only one of three notations, and using the wrong one is the most
common mistake in a first algorithms exam.

| Notation | Meaning | Intuition |
|---|---|---|
| $f = O(g)$ | $f$ grows **no faster** than $g$ | upper bound |
| $f = \\Omega(g)$ | $f$ grows **no slower** than $g$ | lower bound |
| $f = \\Theta(g)$ | both of the above | tight bound |

Saying "quicksort is $O(n^2)$" is *true* but weak. Saying it is $\\Theta(n \\log n)$
**on average** and $\\Theta(n^2)$ **in the worst case** is precise.

> A bound being correct does not make it useful. $n \\log n = O(n^{100})$ is a
> true statement and a useless one.

## Counting operations in real code

Here is the part that actually matters day to day: reading a function and
naming its complexity.

\`\`\`python
def has_duplicate(items):
    """Return True if any value appears twice."""
    seen = set()
    for item in items:          # runs n times
        if item in seen:        # O(1) average for a hash set
            return True
        seen.add(item)          # O(1) amortised
    return False
\`\`\`

The loop runs at most $n$ times and each iteration does constant expected work,
so this is $O(n)$ time and $O(n)$ extra space. Compare that with the naive
version:

\`\`\`python
def has_duplicate_slow(items):
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            if items[i] == items[j]:
                return True
    return False
\`\`\`

The inner loop runs $n-1, n-2, \\ldots, 1$ times, and that sum is:

$$
\\sum_{i=1}^{n-1} i = \\frac{n(n-1)}{2} = \\Theta(n^2)
$$

Trading $O(n)$ memory for a quadratic-to-linear speedup is one of the most
common deals in the whole field.

## Nested loops are not automatically quadratic

This trips up a lot of people. Look at this C++ snippet:

\`\`\`cpp
int count = 0;
for (int i = 1; i <= n; i *= 2) {   // doubles each time
    for (int j = 0; j < i; ++j) {
        ++count;
    }
}
\`\`\`

The outer loop runs $\\log_2 n$ times, but the inner loop's length changes.
The total work is a geometric series:

$$
1 + 2 + 4 + \\cdots + n = 2n - 1 = \\Theta(n)
$$

Linear, not $O(n \\log n)$. **Always sum the actual work — do not multiply loop
counts reflexively.**

## Amortised analysis in one paragraph

When you append to a dynamic array (\`list.append\`, \`std::vector::push_back\`),
most calls are $O(1)$, but occasionally the array doubles and copies everything,
costing $O(n)$. Averaged over $n$ appends, the total copying work is
$1 + 2 + 4 + \\cdots + n < 2n$, so each append is $O(1)$ **amortised**. That is a
different claim from "every append is fast" — it means the expensive ones are
rare enough not to matter.

## The mistakes worth memorising

- Confusing worst case with Big-O. They are independent ideas: you can state an
  upper bound on the best case too.
- Dropping a variable. A graph algorithm is $O(V + E)$, not "$O(n)$".
- Ignoring the cost of built-ins. \`if x in my_list\` is $O(n)$, not $O(1)$ —
  that single character difference between a list and a set changes the
  complexity class of your whole function.

Next in this series I will use exactly this machinery to analyse binary search
and derive its $\\Theta(\\log n)$ bound from the recurrence.`,
  },
  {
    title: "Binary Search Is Harder Than It Looks",
    slug: "binary-search-is-harder-than-it-looks",
    excerpt:
      "A famously simple algorithm that was broken in the JDK for nine years. Here is the correct implementation, the invariant that makes it work, and the off-by-one traps.",
    category: "Algorithms",
    tags: ["Algorithms", "Searching", "Complexity"],
    seriesSlug: "dsa",
    seriesOrder: 2,
    daysAgo: 33,
    viewCount: 967,
    seoDescription:
      "How to write binary search correctly: loop invariants, the overflow bug that lived in java.util.Arrays for nine years, and finding boundaries instead of exact matches.",
    content: `Jon Bentley reported that when he asked professional programmers to write
binary search, roughly **90% of them got it wrong**. A version of the algorithm
shipped broken in \`java.util.Arrays\` for nine years. For something that fits in
twelve lines, that is remarkable.

The reason is that binary search has a tight loop invariant and several
boundary conditions that all look correct until they are not.

## The invariant

The whole algorithm rests on one sentence:

> If the target exists in the array, it lies within \`[low, high]\`.

Every line of the implementation exists to preserve that statement. Once you
have it, the code writes itself.

\`\`\`python
def binary_search(arr, target):
    low, high = 0, len(arr) - 1      # invariant holds: whole array

    while low <= high:               # non-empty search space
        mid = low + (high - low) // 2
        if arr[mid] == target:
            return mid
        if arr[mid] < target:
            low = mid + 1            # target cannot be at or below mid
        else:
            high = mid - 1           # target cannot be at or above mid

    return -1
\`\`\`

Note \`low + (high - low) // 2\` rather than \`(low + high) // 2\`. In Python it
makes no difference because integers are arbitrary precision. In Java, C++ or
Rust it very much does:

\`\`\`java
// The bug that lived in the JDK from 1997 to 2006:
int mid = (low + high) / 2;        // overflows when low + high > 2^31 - 1

// The fix:
int mid = low + (high - low) / 2;  // cannot overflow
\`\`\`

For arrays larger than about 1.07 billion elements, \`low + high\` exceeds
\`Integer.MAX_VALUE\`, wraps negative, and the program throws an
\`ArrayIndexOutOfBoundsException\`.

## Why it is logarithmic

Each iteration discards half the remaining candidates. If $T(n)$ is the number
of comparisons on an array of size $n$:

$$
T(n) = T\\!\\left(\\frac{n}{2}\\right) + O(1), \\qquad T(1) = O(1)
$$

Expanding the recurrence $k$ times gives $T(n) = T(n/2^k) + O(k)$. The base case
is reached when $n/2^k = 1$, i.e. $k = \\log_2 n$. Therefore:

$$
T(n) = \\Theta(\\log n)
$$

This is also exactly what the Master Theorem gives you with $a = 1$, $b = 2$,
$f(n) = O(1)$ — case 2, yielding $\\Theta(\\log n)$.

To feel what that means: searching **one million** sorted items takes at most 20
comparisons. Searching **one billion** takes 30.

## The three loop conditions

Most bugs come from mismatching these three decisions:

| Initial \`high\` | Loop condition | Update |
|---|---|---|
| \`len(arr) - 1\` | \`low <= high\` | \`high = mid - 1\` |
| \`len(arr)\` | \`low < high\` | \`high = mid\` |

Mixing rows — say \`high = len(arr)\` with \`low <= high\` — gives you an index
error or an infinite loop. Pick one convention and stay in it.

## The version you actually need more often

Exact-match search is the textbook case, but in practice you usually want a
**boundary**: the first element $\\ge$ some value. That is \`bisect_left\`, and it
is the building block for range queries, insertion points and
"find the first failing version" problems.

\`\`\`python
def lower_bound(arr, target):
    """Index of the first element >= target (may be len(arr))."""
    low, high = 0, len(arr)          # note: high is exclusive here

    while low < high:                # note: strict inequality
        mid = low + (high - low) // 2
        if arr[mid] < target:
            low = mid + 1
        else:
            high = mid               # keep mid as a candidate

    return low
\`\`\`

The critical difference is \`high = mid\` rather than \`mid - 1\`: when
\`arr[mid] >= target\`, \`mid\` itself is still a valid answer, so we must not
discard it.

\`\`\`python
>>> lower_bound([1, 3, 3, 3, 7], 3)
1
>>> lower_bound([1, 3, 3, 3, 7], 4)
4
>>> lower_bound([1, 3, 3, 3, 7], 0)
0
\`\`\`

## Binary searching on the answer

The most useful generalisation: you can binary search over any **monotonic
predicate**, not just a sorted array. If \`f(x)\` is false, false, false, true,
true — you can find the boundary in $O(\\log n)$ evaluations.

\`\`\`typescript
function firstTrue(lo: number, hi: number, predicate: (x: number) => boolean): number {
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (predicate(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

// "What is the smallest ship capacity that ships all packages in D days?"
const capacity = firstTrue(maxWeight, totalWeight, (c) => daysNeeded(c) <= D);
\`\`\`

Recognising that a problem hides a monotonic predicate is, in my experience,
the single highest-value pattern in competitive programming.

## Checklist before you submit

- Does \`mid\` overflow in your language?
- Does the search space shrink on **every** path? (If \`low = mid\`, it may not.)
- Is \`high\` inclusive or exclusive, and does the loop condition match?
- What is returned when the target is absent?`,
  },
  {
    title: "Processes vs Threads: What Actually Differs",
    slug: "processes-vs-threads",
    excerpt:
      "Both run code concurrently, so why have both? A look at address spaces, context switching costs, and the real reason threads are cheaper.",
    category: "Operating Systems",
    tags: ["Operating Systems", "Concurrency", "Systems"],
    seriesSlug: "operating-systems",
    seriesOrder: 1,
    daysAgo: 21,
    viewCount: 1502,
    seoDescription:
      "The concrete differences between processes and threads: address spaces, what the kernel stores per task, context switch costs, and when to pick each model.",
    content: `"A process is a running program; a thread is a lightweight process." That is
the answer everyone memorises for the exam, and it explains almost nothing.
What is actually *lighter* about it?

The honest answer: **it is all about the address space.**

## What a process owns

When the kernel creates a process it allocates:

- A private virtual **address space** (code, data, heap, stack)
- A **page table** mapping virtual to physical addresses
- A **file descriptor table**
- Signal handlers, a working directory, user/group ids
- At least one thread of execution

The address space is the expensive part. Two processes cannot read each other's
memory — a pointer in process A is meaningless in process B, because the same
virtual address maps to different physical frames.

\`\`\`c
#include <stdio.h>
#include <unistd.h>

int counter = 0;

int main(void) {
    pid_t pid = fork();      // child gets a COPY of the address space

    if (pid == 0) {
        counter += 100;
        printf("child:  counter = %d\\n", counter);   // 100
    } else {
        sleep(1);
        printf("parent: counter = %d\\n", counter);   // 0 — unaffected
    }
    return 0;
}
\`\`\`

The child's write to \`counter\` is invisible to the parent. Modern kernels do
this efficiently with **copy-on-write**: the page tables initially point at the
same physical pages marked read-only, and a page is only duplicated when one
side writes to it.

## What a thread owns

A thread within a process gets its **own**:

- Stack
- Program counter and register set
- Thread-local storage

and **shares** everything else — heap, globals, file descriptors, code.

\`\`\`c
#include <stdio.h>
#include <pthread.h>

int counter = 0;                     // shared between all threads

void *worker(void *arg) {
    (void)arg;
    counter += 100;                  // visible to every thread
    return NULL;
}

int main(void) {
    pthread_t t;
    pthread_create(&t, NULL, worker, NULL);
    pthread_join(t, NULL);
    printf("counter = %d\\n", counter);   // 100
    return 0;
}
\`\`\`

That shared heap is simultaneously the entire advantage and the entire danger.

## The cost of a context switch

Switching between two threads of the same process means saving registers and
swapping stacks. Switching between processes additionally means **swapping page
tables**, which invalidates TLB entries.

| Operation | Rough cost |
|---|---|
| Function call | ~1–2 ns |
| Thread switch (same process) | ~1–2 µs |
| Process switch | ~3–5 µs (plus TLB refill) |
| \`fork()\` a process | ~50–500 µs |

Those TLB misses are the hidden cost. After a process switch, address
translations must be re-walked from the page table, and a page walk on x86-64
touches four levels of tables. Tagged TLBs (via PCID) mitigate but do not
eliminate this.

## Race conditions: the price of sharing

Because threads share memory, \`counter += 1\` is a bug waiting to happen. It is
not one instruction — it is three:

\`\`\`asm
mov  eax, [counter]    ; load
add  eax, 1            ; modify
mov  [counter], eax    ; store
\`\`\`

If two threads interleave between the load and the store, one increment is
lost. With $N$ threads each incrementing $k$ times, the final value can be
anything from $k$ to $N \\cdot k$.

The fix is mutual exclusion:

\`\`\`c
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;

void *worker(void *arg) {
    for (int i = 0; i < 100000; ++i) {
        pthread_mutex_lock(&lock);
        counter += 1;                 // critical section
        pthread_mutex_unlock(&lock);
    }
    return NULL;
}
\`\`\`

Correct, but now threads serialise on the lock. **Amdahl's law** puts a hard
ceiling on what you gain: if a fraction $p$ of the work is parallelisable
across $N$ cores, the speedup is

$$
S(N) = \\frac{1}{(1 - p) + \\frac{p}{N}}
$$

With $p = 0.95$, even infinite cores give you at most $20\\times$. The
5% serial section dominates.

## Choosing between them

Use **processes** when you want isolation: a crash or memory corruption in one
worker must not take down the others. This is why Chrome puts tabs in separate
processes and why nginx uses a process-per-worker model.

Use **threads** when tasks share large amounts of state and you cannot afford to
copy or serialise it between them.

And note the third option that modern runtimes prefer: **async I/O on a single
thread**. If your workload is I/O-bound, the bottleneck is waiting on sockets,
not CPU — an event loop handles ten thousand connections without ten thousand
stacks. That is exactly what Node.js does, and why a Node server can be
single-threaded and still be fast.`,
  },
  {
    title: "Virtual Memory and the Page Table",
    slug: "virtual-memory-and-the-page-table",
    excerpt:
      "How every process gets to believe it owns all the memory: address translation, multi-level page tables, the TLB, and what actually happens on a page fault.",
    category: "Operating Systems",
    tags: ["Operating Systems", "Memory", "Systems"],
    seriesSlug: "operating-systems",
    seriesOrder: 2,
    daysAgo: 12,
    viewCount: 803,
    seoDescription:
      "A clear walkthrough of virtual memory: virtual-to-physical address translation, why page tables are multi-level, how the TLB works, and the page fault path.",
    content: `Run this in two terminals at the same time:

\`\`\`c
#include <stdio.h>
int global = 42;
int main(void) { printf("%p\\n", (void *)&global); getchar(); return 0; }
\`\`\`

Both processes print the *same* address. Neither is lying, and they are not
sharing memory. This is virtual memory: every process gets its own private
map from addresses to actual RAM.

## Translation, conceptually

Every address your program uses is **virtual**. The CPU translates it to a
**physical** address before touching RAM. Memory is divided into fixed-size
**pages** (4 KiB on x86-64), and physical memory into equally sized **frames**.

A virtual address splits into two parts:

$$
\\text{virtual address} = (\\text{page number}, \\text{offset})
$$

With 4 KiB pages, the low $\\log_2 4096 = 12$ bits are the offset and the rest
is the page number. Translation replaces the page number with a frame number
and leaves the offset untouched:

$$
\\text{physical address} = \\text{frame}(\\text{page}) \\times 4096 + \\text{offset}
$$

## Why page tables are multi-level

A single flat table is impossible. On a 64-bit machine with 48-bit addresses
and 4 KiB pages there are

$$
\\frac{2^{48}}{2^{12}} = 2^{36} \\approx 68 \\text{ billion pages}
$$

At 8 bytes per entry that is 512 GiB of page table — **per process**. Absurd.

The fix is a **sparse, multi-level radix tree**. x86-64 uses four levels, each
indexed by 9 bits of the address:

\`\`\`text
 47        39 38        30 29        21 20        12 11         0
+------------+------------+------------+------------+------------+
|   PML4     |    PDPT    |     PD     |     PT     |   offset   |
|   9 bits   |   9 bits   |   9 bits   |   9 bits   |  12 bits   |
+------------+------------+------------+------------+------------+
\`\`\`

Each level holds $2^9 = 512$ entries in exactly one 4 KiB page. The win is
sparsity: a process using 1 MiB of memory needs only a handful of tables, not
billions of entries. Unmapped regions are simply null pointers at a high level.

The cost is that translation now requires **four memory reads** before the real
access. That would make every load five times slower.

## The TLB saves it

The **Translation Lookaside Buffer** is a small, fully-associative cache of
recent translations, typically 64–1536 entries, sitting inside the MMU.

Hit rates are extremely high — usually above 99% — because of locality: a
single 4 KiB page covers 1024 consecutive \`int\`s, so a sequential scan takes
one TLB miss per thousand accesses.

Effective access time with hit rate $h$, memory time $m$, and a page walk of
$w$ additional reads:

$$
T_{\\text{eff}} = h \\cdot m + (1 - h) \\cdot (w \\cdot m + m)
$$

With $h = 0.99$, $m = 100\\,\\text{ns}$, $w = 4$: about $104\\,\\text{ns}$ — a 4%
penalty instead of 400%.

This is also why **stride matters** so much in real code:

\`\`\`cpp
// Row-major traversal: sequential, TLB and cache friendly
for (int i = 0; i < N; ++i)
    for (int j = 0; j < N; ++j)
        sum += matrix[i][j];        // fast

// Column-major traversal on a row-major array: a new page almost every step
for (int j = 0; j < N; ++j)
    for (int i = 0; i < N; ++i)
        sum += matrix[i][j];        // often 5-10x slower
\`\`\`

Same arithmetic, same number of operations. The only difference is memory
access order, and it can cost you an order of magnitude.

## The page fault path

When a translation has no valid frame, the CPU raises a **page fault** and traps
into the kernel. There are three flavours:

1. **Minor fault** — the page is in memory but not mapped in this table (e.g.
   shared library already loaded by another process). Just fix the mapping.
2. **Major fault** — the page must be read from disk or swap. Costs milliseconds:
   roughly 10,000× a RAM access.
3. **Invalid fault** — the address is genuinely bad. The kernel delivers
   \`SIGSEGV\`, and you get your segmentation fault.

That first category is what makes \`fork()\` cheap and why demand paging works:
a program's pages are loaded lazily, on first touch, rather than all at once.

## What this buys you

- **Isolation.** Process A literally cannot name process B's memory.
- **Overcommit.** The sum of all virtual address spaces may exceed physical RAM.
- **Sharing.** One copy of libc, mapped into every process.
- **Copy-on-write.** \`fork()\` duplicates page tables, not pages.
- **mmap.** Files mapped into the address space, paged in on demand.

Virtual memory is the single abstraction that makes multiprogramming safe, and
almost everything else in the OS is built on top of it.`,
  },
  {
    title: "Database Indexes: Why B-Trees Won",
    slug: "database-indexes-why-b-trees-won",
    excerpt:
      "Hash tables are O(1) and binary search trees are O(log n), so why does every relational database use a B-tree? The answer is about disks, not asymptotics.",
    category: "Databases",
    tags: ["Databases", "Data Structures", "Systems"],
    daysAgo: 4,
    viewCount: 421,
    seoDescription:
      "Why relational databases index with B+ trees instead of hash tables or binary search trees: disk block sizes, fanout, range queries and the cost of a random read.",
    content: `A binary search tree finds a key in $O(\\log_2 n)$ comparisons, which for a
million rows is about 20 steps. A hash table does it in $O(1)$. Yet open
PostgreSQL, MySQL, SQLite or SQL Server and the default index is a **B+ tree**.

The reason is that asymptotic analysis counts *comparisons*, and databases are
bottlenecked on something else entirely: **disk reads**.

## The cost model is different

In-memory algorithm analysis assumes every memory access costs the same. For a
database that assumption is wildly wrong:

| Operation | Latency | Relative |
|---|---|---|
| L1 cache reference | 1 ns | 1× |
| Main memory reference | 100 ns | 100× |
| SSD random read | 100 µs | 100,000× |
| HDD seek | 10 ms | 10,000,000× |

The right cost model counts **block transfers**, not comparisons. Storage is
read in fixed-size pages (commonly 8 KiB in PostgreSQL, 16 KiB in InnoDB) — you
cannot read one byte from disk, only a whole page.

Now reconsider that binary search tree. Each node holds one key and two
pointers, maybe 40 bytes. Reading it pulls in an entire 8 KiB page to use 40
bytes of it, and the next node is somewhere else entirely. **20 comparisons
becomes 20 random reads.** On an HDD that is 200 ms for a single lookup.

## Fanout is the whole trick

A B+ tree node is sized to exactly one disk page and holds hundreds of keys.
With 8 KiB pages and roughly 16 bytes per key-plus-pointer, one node holds
about 500 entries.

The height of a tree with fanout $b$ over $n$ keys is:

$$
h = \\lceil \\log_b n \\rceil
$$

Compare the two at $n = 10^6$ and $n = 10^9$:

$$
\\log_2 10^6 \\approx 20 \\qquad \\log_{500} 10^6 \\approx 2.2
$$

$$
\\log_2 10^9 \\approx 30 \\qquad \\log_{500} 10^9 \\approx 3.3
$$

**A billion rows is four disk reads.** And because the root and the level below
it stay cached in RAM, in practice it is usually one or two *actual* reads.

## The "+" in B+ tree

In a B+ tree, only the **leaves** hold row data or row pointers; internal nodes
hold keys purely for navigation.

\`\`\`text
                    [ 50 | 100 ]                  <- internal: routing only
                   /     |      \\
        [10|25|40]   [60|75|90]   [110|150]       <- internal
         /  |  \\        ...          ...
    [leaf]<->[leaf]<->[leaf]<->[leaf]<->[leaf]    <- data + sibling links
\`\`\`

Two consequences, both important:

1. **Higher fanout.** Internal nodes store no payload, so more keys fit per
   page, so the tree is shallower.
2. **Linked leaves.** Range scans walk sideways through the leaf list without
   ever going back up the tree.

That second point is why hash indexes lose. This query:

\`\`\`sql
SELECT * FROM orders
WHERE created_at BETWEEN '2026-01-01' AND '2026-03-31'
ORDER BY created_at;
\`\`\`

is one descent plus a sequential leaf walk in a B+ tree. A hash index cannot do
it at all — hashing destroys ordering, so the planner falls back to a full
table scan. Hash indexes only serve \`=\`.

## Composite indexes and the leftmost prefix rule

An index on \`(a, b, c)\` sorts rows by \`a\`, then \`b\`, then \`c\` — like a
dictionary sorted by surname, then first name. That means it can serve:

\`\`\`sql
WHERE a = 1                  -- yes
WHERE a = 1 AND b = 2        -- yes
WHERE a = 1 AND b = 2 AND c = 3   -- yes
\`\`\`

but **not**:

\`\`\`sql
WHERE b = 2                  -- no: cannot skip the leading column
WHERE c = 3                  -- no
\`\`\`

Looking up by \`b\` alone in an index sorted by \`a\` is like finding everyone
named "James" in a phone book sorted by surname. Column order in a composite
index is a real design decision, not a formality.

## When the index is skipped

Indexes are not free and are not always used:

- **Low selectivity.** If a predicate matches 40% of the table, a sequential
  scan beats millions of random row lookups. Planners know this.
- **Functions on the column.** \`WHERE LOWER(email) = 'a@b.com'\` cannot use a
  plain index on \`email\`; you need an expression index on \`LOWER(email)\`.
- **Write cost.** Every index must be updated on every INSERT, UPDATE and
  DELETE. Six indexes means six extra B-tree writes per row.

\`\`\`sql
-- Always check what the planner actually does:
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'someone@example.com';
\`\`\`

If you see \`Seq Scan\` where you expected \`Index Scan\`, the planner is either
right or missing statistics — and \`EXPLAIN ANALYZE\` is the only way to find out.

## The one-line summary

B+ trees won because they minimise the operation that actually costs money.
Optimising for the real cost model beats optimising for the textbook one — and
that lesson generalizes well beyond databases.`,
  },
];
