#!/usr/bin/env python3
"""
small helper script used to compare timing of verify() & dummy_verify()
"""
# core
from __future__ import absolute_import, division, print_function, unicode_literals
from argparse import ArgumentParser
import sys
from timeit import default_timer as tick
# site
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
# pkg
from passlib.context import CryptContext
# local
__all__ = [
    "main"
]

def main(*args):
    #
    # parse args
    #
    parser = ArgumentParser("""plot hash timing""")
    parser.add_argument("-n", "--number", help="number of iterations",
                        type=int, default=300)
    parser.add_argument("-o", "--output", help="pdf file",
                        default="plot_hash.pdf")

    opts = parser.parse_args(args)

    #
    # init vars
    #
    ctx = CryptContext(schemes=["pbkdf2_sha256"])

    secret = "a9w3857naw958ioa"
    wrong_secret = "q0389wairuowieru"
    hash = ctx.hash(secret)
    ctx.dummy_verify()

    correct = []
    wrong = []
    missing = []

    loops = opts.number

    #
    # run timing loop
    #
    for _ in range(loops):
        # correct pwd
        start = tick()
        ctx.verify(secret, hash)
        delta = tick() - start
        correct.append(delta)

        # wrong pwd
        start = tick()
        ctx.verify(wrong_secret, hash)
        delta = tick() - start
        wrong.append(delta)

        # wrong user / dummy verify
        start = tick()
        ctx.dummy_verify()
        delta = tick() - start
        missing.append(delta)

    #
    # calc quartiles for verify() samples
    #
    samples = sorted(correct + wrong)
    count = len(samples)
    q1 = samples[count // 4]
    q3 = samples[count * 3 // 4]
    iqr = q3 - q1
    ub = q3 + 1.5 * iqr
    lb = q1 - 1.5 * iqr

    #
    # add in dummy samples, calc bounds
    #
    samples.extend(missing)
    ymin = min(min(samples), lb - 0.5 * iqr)
    ymax = max(max(samples), ub)

    #
    # generate graph
    #
    with PdfPages(opts.output) as pdf:
        plt.plot(range(loops), correct, 'go', label="verify success")
        plt.plot(range(loops), wrong, 'yo', label="verify failed")
        plt.plot(range(loops), missing, 'ro', label="dummy_verify()")

        plt.axis([0, loops, ymin, ymax])

        plt.axhline(y=q1, xmax=count, color="r")
        plt.axhline(y=q3, xmax=count, color="r")
        plt.axhline(y=lb, xmax=count, color="orange")
        plt.axhline(y=ub, xmax=count, color="orange")

        plt.ylabel('elapsed time')
        plt.xlabel('loop count')
        plt.legend(shadow=True, title="Legend", fancybox=True)

        plt.title('%s verify timing' % ctx.handler().name)
        pdf.savefig()
        plt.close()

if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:]))

